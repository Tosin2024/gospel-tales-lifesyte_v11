import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default async function Leaderboard(){
 const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
 const {data}=await supabase.from("leaderboard").select("full_name,score_percent,points_earned,completed_at").limit(20);
 return <main className="wrap"><Link href="/"><button className="back">← Home</button></Link><h1>🏆 Leaderboard</h1><div className="panel">{(data||[]).map((x,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"40px 1fr auto",padding:"13px 0",borderBottom:"1px solid #eee"}}><b>{i+1}</b><span>{x.full_name||"Learner"}</span><b>{x.score_percent}%</b></div>)}{!data?.length&&<p className="muted">No online scores yet. Be the first learner!</p>}</div></main>
}
