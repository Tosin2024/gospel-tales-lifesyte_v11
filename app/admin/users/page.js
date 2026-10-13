import {redirect} from "next/navigation";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import Link from "next/link";

export default async function Users(){
 const c=cookies(); const s=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll(){return c.getAll()},setAll(){}}});
 const {data:{user}}=await s.auth.getUser();if(!user)redirect("/auth");
 const {data:p}=await s.from("profiles").select("role").eq("id",user.id).single();if(p?.role!=="admin")redirect("/");
 const {data}=await s.from("profiles").select("id,full_name,email,role,points,created_at").order("created_at",{ascending:false}).limit(100);
 return <main className="wrap"><Link href="/admin">← Admin</Link><h1>👥 Users</h1><div className="panel">{(data||[]).map(x=><div key={x.id} style={{padding:"13px 0",borderBottom:"1px solid #eee"}}><b>{x.full_name}</b><div className="muted">{x.email} • {x.role} • {x.points} points</div></div>)}</div></main>
}
