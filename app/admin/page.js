import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Link from "next/link";

export default async function AdminHome(){
  const cookieStore=cookies();
  const supabase=createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {cookies:{getAll(){return cookieStore.getAll()},setAll(){}}}
  );
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) redirect("/auth");
  const {data:profile}=await supabase.from("profiles").select("role,full_name").eq("id",user.id).single();
  if(profile?.role!=="admin") return <main className="wrap"><div className="error"><h2>Admin access required</h2><p>Your account is not assigned the administrator role.</p></div><Link href="/">Return home</Link></main>;
  return <main className="wrap">
    <h1>🔐 GOSPEL TALES LIFESYTE Admin</h1>
    <p className="muted">Welcome, {profile.full_name}. Manage the learning platform from here.</p>
    <div className="grid">
      <Link className="card" href="/admin/questions">📝<b>Questions</b><small>Create, edit, publish and archive questions.</small></Link>
      <Link className="card" href="/admin/content/stories">📖<b>Bible Tales</b><small>Create, edit, publish and feature Bible stories.</small></Link>
      <Link className="card" href="/admin/leaderboard">🏆<b>Quiz Leaderboard</b><small>Review recorded learner scores and quiz attempts.</small></Link>
      <Link className="card" href="/admin/competitions">🏆<b>Competitions</b><small>Create and manage quiz competitions.</small></Link>
      <Link className="card" href="/admin/users">👥<b>Users</b><small>View learner profiles and roles.</small></Link>
      <Link className="card" href="/admin/certificates">🎓<b>Certificates</b><small>Review certificate eligibility and records.</small></Link>
    </div>
    <div className="panel"><b>Security rule:</b> administrative actions must be authorized server-side. Never expose a Supabase service-role key in client code.</div>
  </main>
}
