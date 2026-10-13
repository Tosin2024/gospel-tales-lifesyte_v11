import {redirect} from "next/navigation";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import Link from "next/link";

async function adminClient(){
 const c=cookies();
 return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll(){return c.getAll()},setAll(){}}});
}
export default async function Questions(){
 const supabase=await adminClient();
 const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/auth");
 const {data:p}=await supabase.from("profiles").select("role").eq("id",user.id).single(); if(p?.role!=="admin")redirect("/");
 const {data}=await supabase.from("questions").select("id,question_text,difficulty,status,correct_option,created_at").order("created_at",{ascending:false}).limit(100);
 return <main className="wrap"><Link href="/admin">← Admin</Link><h1>Question Bank</h1>
 <div className="panel"><p className="muted">Questions are protected by database policies. Production create/edit/delete actions should use authenticated server actions.</p></div>
 <div className="panel">{(data||[]).map(q=><div key={q.id} style={{padding:"12px 0",borderBottom:"1px solid #eee"}}><b>{q.question_text}</b><div className="muted">{q.difficulty} • {q.status} • Answer {q.correct_option}</div></div>)}</div>
 </main>
}
