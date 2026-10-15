
'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { supabaseBrowser } from "../../../lib/supabase";

export default function StoryPage({params}) {
const supabase = supabaseBrowser();
 const [story,setStory]=useState(null),[fav,setFav]=useState(false),[done,setDone]=useState(false),[session,setSession]=useState(null);
 useEffect(()=>{load();},[]);
 async function load(){
   const {data:s}=await supabase.from('bible_stories').select('*').eq('slug',params.slug).single();
   setStory(s);
   const {data:{session}}=await supabase.auth.getSession(); setSession(session);
   if(session&&s){
     const {data:f}=await supabase.from('content_favorites').select('id').eq('user_id',session.user.id).eq('content_type','story').eq('content_id',s.id).maybeSingle();
     setFav(!!f);
     const {data:p}=await supabase.from('learning_progress').select('status').eq('user_id',session.user.id).eq('content_type','story').eq('content_id',s.id).maybeSingle();
     setDone(p?.status==='completed');
   }
 }
 async function favorite(){
   if(!session){alert('Please sign in to save favorites.');return;}
   if(fav){await supabase.from('content_favorites').delete().eq('user_id',session.user.id).eq('content_type','story').eq('content_id',story.id);setFav(false);}
   else {await supabase.from('content_favorites').insert({user_id:session.user.id,content_type:'story',content_id:story.id});setFav(true);}
 }
 async function complete(){
   if(!session){alert('Please sign in to save learning progress.');return;}
   await supabase.from('learning_progress').upsert({user_id:session.user.id,content_type:'story',content_id:story.id,status:'completed',progress_percent:100,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id,content_type,content_id'});
   setDone(true);
 }
 if(!story)return <main className="container"><p>Loading story...</p></main>;
 return <main className="container article">
   <Link href="/stories">← All Bible Tales</Link>
   <span className="pill">{story.difficulty}</span><h1>{story.title}</h1><p className="reference">{story.bible_reference}</p>
   <p className="lead">{story.summary}</p>
   <div className="article-body">{story.content.split('\n').map((p,i)=><p key={i}>{p}</p>)}</div>
   <div className="lesson-box"><strong>Key Lesson</strong><p>{story.key_lesson}</p></div>
   <div className="action-row"><button onClick={favorite}>{fav?'★ Saved':'☆ Save to Favorites'}</button><button onClick={complete}>{done?'✓ Completed':'Mark as Completed'}</button></div>
 </main>
}
