
'use client';
import {useEffect,useState} from 'react'; import Link from 'next/link'; import ContentCard from '../../components/ContentCard'; import {supabase} from '../../lib/supabase';
export default function Lessons(){
 const [items,setItems]=useState([]),[q,setQ]=useState('');
 useEffect(()=>{supabase.from('lessons').select('*').eq('published',true).order('featured',{ascending:false}).then(({data})=>setItems(data||[]));},[]);
 const filtered=items.filter(x=>(x.title+' '+(x.objective||'')+' '+(x.bible_reference||'')).toLowerCase().includes(q.toLowerCase()));
 return <main className="container"><div className="page-hero"><Link href="/">← Home</Link><h1>🎓 Bible Lessons</h1><p>Practical lessons for Christian growth.</p></div><input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search lessons..." /><div className="card-grid">{filtered.map(x=><ContentCard key={x.id} type="lesson" title={x.title} summary={x.objective} reference={x.bible_reference} slug={x.slug} featured={x.featured}/>)}</div></main>
}
