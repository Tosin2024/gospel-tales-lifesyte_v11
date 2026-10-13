
'use client';
import {useEffect,useState} from 'react'; import Link from 'next/link'; import {supabase} from '../../lib/supabase';
export default function Notifications(){const [items,setItems]=useState([]);useEffect(()=>{(async()=>{const {data:{session}}=await supabase.auth.getSession();if(!session)return;const {data}=await supabase.from('notifications').select('*').eq('user_id',session.user.id).order('created_at',{ascending:false});setItems(data||[])})()},[]);return <main className="container"><div className="page-hero"><Link href="/">← Home</Link><h1>🔔 Notifications</h1></div><div className="simple-list">{items.map(n=><div key={n.id}><div><strong>{n.title}</strong><p>{n.message}</p></div><span className="pill">{n.type}</span></div>)}</div></main>}
