"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import { supabaseBrowser } from '../../lib/supabase';

export default function Home(){
 const supabase=supabaseBrowser();
 const [user,setUser]=useState(null);
 const [profile,setProfile]=useState(null);
 const [loading,setLoading]=useState(true);
 useEffect(()=>{(async()=>{
   const {data:{user}}=await supabase.auth.getUser();setUser(user);
   if(user){const {data}=await supabase.from("profiles").select("*").eq("id",user.id).single();setProfile(data)}
   setLoading(false);
 })()},[]);
 async function signout(){await supabase.auth.signOut();location.reload();}
 if(loading)return <main className="wrap"><p>Loading GOSPEL TALES LIFESYTE…</p></main>;
 return <><header className="top"><div><b>📖 GOSPEL TALES LIFESYTE</b><small>Learn the Word • Test Your Knowledge • Grow in Christ</small></div>{user?<button onClick={signout}>Sign out</button>:<Link href="/auth" style={{color:"#fff"}}>Sign in</Link>}</header>
 <main className="wrap">
 <div className="hero"><span className="pill">Online Bible Learning Platform</span><h1>Grow in God's Word.</h1><p>Take Bible quizzes, build points, compete on leaderboards and earn certificates.</p><Link href="/quiz"><button className="btn gold">Start Today's Quiz</button></Link></div>
 <div className="grid">
 <Link href="/quiz" className="card">📝<b>Bible Quiz</b><small>Multiple categories and levels</small></Link>
 <div className="card">📖<b>Bible Tales</b><small>Stories and lessons</small></div>
 <Link href="/leaderboard" className="card">🏆<b>Leaderboard</b><small>Online rankings</small></Link>
 <div className="card">🎓<b>Certificates</b><small>Recognition for learners</small></div>
 </div>
 <div className="panel"><h2>{user?`Welcome, ${profile?.full_name||user.email}`:"Welcome, Learner"}</h2><p className="muted">Your account, quiz attempts and points can now be stored securely online.</p>{!user&&<Link href="/auth">Create your learner account →</Link>}</div>
 </main></>
}
