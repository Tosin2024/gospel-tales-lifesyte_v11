
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../lib/supabase';

export default function Competitions(){
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true);
 useEffect(()=>{supabase.from('competitions').select('*').in('status',['open','active']).order('starts_at',{ascending:true}).then(({data})=>{setItems(data||[]);setLoading(false)})},[]);
 return <main className="container">
  <div className="page-hero"><Link href="/">← Home</Link><h1>🏆 Bible Competitions</h1><p>Test your Bible knowledge, earn points and compete fairly.</p></div>
  {loading?<p>Loading competitions...</p>:!items.length?<div className="notice">No open competitions at the moment. Check back soon.</div>:
   <div className="card-grid">{items.map(c=><Link className="content-card" href={`/competition/${c.slug||c.id}`} key={c.id}>
    <span className="pill">{c.status}</span><h3>{c.name}</h3><p>{c.description||'Bible knowledge competition'}</p>
    <p><strong>{c.question_count||10}</strong> questions · <strong>{Math.round((c.duration_seconds||600)/60)}</strong> minutes</p>
    <p>Entry: {Number(c.entry_fee||0)===0?'Free':`${c.currency||'NGN'} ${Number(c.entry_fee).toLocaleString()}`}</p>
   </Link>)}</div>}
 </main>
}
