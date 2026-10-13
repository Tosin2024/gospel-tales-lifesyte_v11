import {redirect} from "next/navigation";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import Link from "next/link";

export default async function Certificates(){
 const c=cookies(); const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll(){return c.getAll()},setAll(){}}});
 const {data:{user}}=await s.auth.getUser();if(!user)redirect("/auth");
 const {data:p}=await s.from("profiles").select("role").eq("id",user.id).single();if(p?.role!=="admin")redirect("/");
 const {data}=await s.from("certificates").select("certificate_number,best_score_percent,issued_at,user_id").order("issued_at",{ascending:false});
 return <main className="wrap"><Link href="/admin">← Admin</Link><h1>🎓 Certificates</h1><div className="panel">{(data||[]).map(x=><div key={x.certificate_number} style={{padding:"13px 0",borderBottom:"1px solid #eee"}}><b>{x.certificate_number}</b><div className="muted">User: {x.user_id} • Score: {x.best_score_percent}% • {new Date(x.issued_at).toLocaleDateString()}</div></div>)}</div></main>
}
