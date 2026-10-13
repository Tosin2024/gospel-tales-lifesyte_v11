
'use client';
import {useEffect,useState} from 'react'; import Link from 'next/link'; import {useRouter} from 'next/navigation'; import {supabase} from '../../../../lib/supabase';
export default function CompetitionQuiz({params}){
 const [c,setC]=useState(null),[qs,setQs]=useState([]),[answers,setAnswers]=useState({}),[idx,setIdx]=useState(0),[remaining,setRemaining]=useState(0),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(null),[session,setSession]=useState(null);const router=useRouter();
 useEffect(()=>{start()},[]);
 useEffect(()=>{if(!attempt||remaining<=0)return;const t=setInterval(()=>setRemaining(x=>x-1),1000);return()=>clearInterval(t)},[attempt]);
 useEffect(()=>{if(attempt&&remaining===0)submit()},[remaining]);
 async function start(){
  const {data:{session}}=await supabase.auth.getSession();setSession(session);if(!session){router.push('/auth');return;}
  const {data:c0}=await supabase.from('competitions').select('*').eq('slug',params.slug).single();setC(c0);
  const {data:r}=await supabase.from('competition_registrations').select('*').eq('competition_id',c0.id).eq('user_id',session.user.id).eq('status','registered').maybeSingle();
  if(!r){alert('You must be registered before entering.');router.push(`/competition/${params.slug}`);return;}
  const {data:existing}=await supabase.from('competition_attempts').select('*').eq('competition_id',c0.id).eq('user_id',session.user.id).maybeSingle();
  if(existing){setAttempt(existing);setRemaining(Math.max(0,(c0.duration_seconds||600)-existing.time_seconds));}
  else {const {data:a}=await supabase.from('competition_attempts').insert({competition_id:c0.id,user_id:session.user.id,registration_id:r.id,total_questions:c0.question_count||10}).select().single();setAttempt(a);setRemaining(c0.duration_seconds||600);}
  const {data:questions}=await supabase.from('questions').select('*').eq('published',true).limit(c0.question_count||10);setQs(questions||[]);setLoading(false);
 }
 async function submit(){if(!attempt||!qs.length)return;const score=qs.reduce((n,q)=>n+(String(answers[q.id])===String(q.correct_answer)?1:0),0);const elapsed=(c?.duration_seconds||600)-remaining;const pct=score/qs.length*100;await supabase.from('competition_attempts').update({answers,score,total_questions:qs.length,percentage:pct,time_seconds:elapsed,submitted_at:new Date().toISOString(),status:'submitted'}).eq('id',attempt.id);router.push(`/competition/${params.slug}/results`)}
 if(loading)return <main className="container">Preparing competition...</main>;if(!qs.length)return <main className="container"><p>No published questions are available for this competition yet.</p></main>;
 const q=qs[idx];
 return <main className="container quiz-page"><div className="quiz-head"><span>Question {idx+1} / {qs.length}</span><strong>{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</strong></div><h1>{q.question}</h1><div className="answers">{(q.options||[]).map((opt,i)=><button className={answers[q.id]===opt?'selected':''} key={i} onClick={()=>setAnswers({...answers,[q.id]:opt})}>{opt}</button>)}</div><div className="action-row">{idx>0&&<button onClick={()=>setIdx(idx-1)}>← Previous</button>}{idx<qs.length-1?<button onClick={()=>setIdx(idx+1)}>Next →</button>:<button onClick={submit}>Submit Competition</button>}</div></main>
}
