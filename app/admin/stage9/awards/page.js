
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';
export default function Awards(){
 const [rows,setRows]=useState([]);
 useEffect(()=>{supabase.from('prize_awards').select('*').order('created_at',{ascending:false}).limit(100).then(({data})=>setRows(data||[]))},[]);
 async function approve(id){await supabase.from('prize_awards').update({status:'approved'}).eq('id',id);setRows(rows.map(x=>x.id===id?{...x,status:'approved'}:x))}
 return <main className="container"><Link href="/admin">← Admin</Link><h1>🎁 Prize Approval</h1><p className="notice">Approval is a controlled administrative step. Actual money transfer must be performed and reconciled through the configured payment/payout provider.</p><div className="admin-table">{rows.map(x=><div className="admin-row" key={x.id}><div><strong>Position {x.position}</strong><small>{x.amount} {x.currency}</small></div><span>{x.status}</span>{x.status==='pending'&&<button onClick={()=>approve(x.id)}>Approve</button>}</div>)}</div></main>
}
