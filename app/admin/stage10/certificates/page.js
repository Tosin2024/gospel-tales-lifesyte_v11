
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';
export default function CertificateCenter(){
 const [rows,setRows]=useState([]),[msg,setMsg]=useState('');
 async function load(){const {data}=await supabase.from('competition_certificates').select('*').order('created_at',{ascending:false}).limit(100);setRows(data||[])}
 useEffect(()=>{load()},[]);
 async function queue(id){const {data,error}=await supabase.rpc('queue_certificate_generation',{p_certificate_id:id});setMsg(error?.message||`Job queued: ${data}`)}
 return <main className="container"><Link href="/admin/stage10">← Operations Center</Link><h1>🏅 Certificate Center</h1><p className="notice">Issue/queue certificates from trusted admin workflows. PDF generation is performed server-side.</p>{msg&&<div className="lesson-box">{msg}</div>}<div className="admin-table">{rows.map(x=><div className="admin-row" key={x.id}><div><strong>{x.certificate_number}</strong><small>{x.recipient_name} · {x.certificate_type}</small></div><span>{x.status}</span><button onClick={()=>queue(x.id)}>Queue PDF</button></div>)}</div></main>
}
