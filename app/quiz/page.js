"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {supabaseBrowser} from "../../lib/supabase";

export default function Quiz(){
 const supabase=supabaseBrowser();
 const [questions,setQuestions]=useState([]),[idx,setIdx]=useState(0),[score,setScore]=useState(0),[selected,setSelected]=useState(null),[done,setDone]=useState(false),[loading,setLoading]=useState(true),[user,setUser]=useState(null);
 useEffect(()=>{(async()=>{
   const {data:{user}}=await supabase.auth.getUser();setUser(user);
   const {data,error}=await supabase.from("questions").select("id,category_id,difficulty,question_text,option_a,option_b,option_c,option_d,correct_option,explanation").eq("status","published").limit(50);
   if(!error&&data)setQuestions(data.sort(()=>Math.random()-.5).slice(0,10));setLoading(false);
 })()},[]);
 if(loading)return <main className="wrap"><p>Loading quiz…</p></main>;
 if(!user)return <main className="wrap"><div className="panel"><h2>Sign in to take the online quiz</h2><p className="muted">Your score needs an account so it can be saved to your online profile.</p><Link href="/auth">Sign in / Create account</Link></div></main>;
 if(!questions.length)return <main className="wrap"><div className="error">No published questions are available yet. Add questions through the admin/database setup.</div></main>;
 if(done)return <main className="wrap"><div className="result"><small>QUIZ COMPLETE</small><strong>{score}/{questions.length}</strong><b>{Math.round(score/questions.length*100)}%</b><p>{score/questions.length>=.8?"Excellent!":"Keep learning and try again."}</p></div><Link href="/"><button className="btn gold">Back Home</button></Link></main>;
 const q=questions[idx];const options=[q.option_a,q.option_b,q.option_c,q.option_d],letters=["A","B","C","D"];
 function choose(i){if(selected!==null)return;setSelected(i);if(letters[i]===q.correct_option)setScore(s=>s+1);}
 async function next(){
   if(selected===null)return;
   if(idx<questions.length-1){setIdx(i=>i+1);setSelected(null);return;}
   const finalScore=score;
   await supabase.from("quiz_attempts").insert({user_id:user.id,total_questions:questions.length,correct_answers:finalScore,score_percent:Math.round(finalScore/questions.length*100),points_earned:finalScore*10});
   setDone(true);
 }
 return <main className="wrap"><Link href="/"><button className="back">← Home</button></Link><div className="quizbar"><span className="pill">Question {idx+1} of {questions.length}</span><span className="pill">{q.difficulty}</span></div><div className="bar" style={{margin:"14px 0"}}><i style={{width:`${(idx+1)/questions.length*100}%`}}/></div><div className="panel"><h2>{q.question_text}</h2>{options.map((x,i)=><button key={i} className={`choice ${selected!==null&&letters[i]===q.correct_option?"correct":""} ${selected===i&&letters[i]!==q.correct_option?"wrong":""}`} onClick={()=>choose(i)}>{letters[i]}. {x}</button>)}{selected!==null&&<p className="muted"><b>Explanation:</b> {q.explanation}</p>}</div><button className="btn primary" onClick={next}>{idx===questions.length-1?"Finish Quiz":"Next Question"}</button></main>
}
