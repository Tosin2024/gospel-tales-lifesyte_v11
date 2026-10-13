import {redirect} from "next/navigation";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import Link from "next/link";

export default async function Competitions(){
 const c=cookies(); const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll(){return c.getAll()},setAll(){}}});
 const {data:{user}}=await s.auth.getUser();if(!user)redirect("/auth");
 const {data:p}=await s.from("profiles").select("role").eq("id",user.id).single();if(p?.role!=="admin")redirect("/");
 const {data}=await s.from("competitions").select("*").order("starts_at",{ascending:false});
 return <main className="wrap"><Link href="/admin">← Admin</Link><h1>🏆 Competitions</h1><div className="panel">{(data||[]).map(x=><div key={x.id} style={{padding:"14px 0",borderBottom:"1px solid #eee"}}><b>{x.title}</b><div className="muted">{x.status} • {new Date(x.starts_at).toLocaleString()} → {new Date(x.ends_at).toLocaleString()}</div><div>Entry points: {x.entry_points}</div></div>)}{!data?.length&&<p className="muted">No competitions have been created yet.</p>}</div></main>
}
