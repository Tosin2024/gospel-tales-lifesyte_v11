
'use client';
import {useEffect,useState} from 'react'; import Link from 'next/link'; import {supabase} from '../../../lib/supabase';
export default function Lesson({params}){
 const [x,setX]=useState(null),[done,setDone]=useState(false);
 useEffect(()=>{(async()=>{const {data}=await supabase.from('lessons').select('*').eq('slug',params.slug).single();setX(data);const {data:{session}}=await supabase.auth.getSession();if(session&&data){const {data:p}=await supabase.from('learning_progress').select('status').eq('user_id',session.user.id).eq('content_type','lesson').eq('content_id',data.id).maybeSingle();setDone(p?.status==='completed')}})()},[]);
 async function complete(){const {data:{session}}=await supabase.auth.getSession();if(!session){alert('Please sign in to save progress.');return;}await supabase.from('learning_progress').upsert({user_id:session.user.id,content_type:'lesson',content_id:x.id,status:'completed',progress_percent:100,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,content_type,content_id'});setDone(true)}
 if(!x)return <main className="container">Loading lesson...</main>;
 return <main className="container article"><Link href="/lessons">← All Lessons</Link><h1>{x.title}</h1><p className="reference">{x.bible_reference}</p><h2>Objective</h2><p>{x.objective}</p><h2>Introduction</h2><p>{x.introduction}</p><h2>Lesson</h2><div className="article-body">{x.content.split('\n').map((p,i)=><p key={i}>{p}</p>)}</div><div className="lesson-box"><strong>Application</strong><p>{x.application}</p></div><button onClick={complete}>{done?'✓ Lesson Completed':'Mark Lesson as Completed'}</button></main>
}
