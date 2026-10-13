
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';

export default function Finalize(){
 const [items,setItems]=useState([]),[msg,setMsg]=useState('');
 async function load(){const {data}=await supabase.from('competitions').select('id,name,status').order('created_at',{ascending:false});setItems(data||[])}
 useEffect(()=>{load()},[]);
 async function finalize(id){
   const {data,error}=await supabase.rpc('finalize_competition',{p_competition:id});
   if(error)setMsg(error.message); else {setMsg(JSON.stringify(data));load()}
 }
 return <main className="container"><Link href="/admin">← Admin</Link><h1>⚙️ Finalize Competitions</h1>
 <p className="notice">Finalization snapshots eligible rankings and marks the competition completed. Use only after the competition has actually closed.</p>
 {msg&&<div className="lesson-box">{msg}</div>}
 <div className="admin-table">{items.map(x=><div className="admin-row" key={x.id}><div><strong>{x.name}</strong><small>{x.status}</small></div><button disabled={x.status==='completed'} onClick={()=>finalize(x.id)}>{x.status==='completed'?'Completed':'Finalize'}</button></div>)}</div>
 </main>
}
