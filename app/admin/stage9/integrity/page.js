
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';
export default function Integrity(){
 const [rows,setRows]=useState([]);
 useEffect(()=>{supabase.from('competition_integrity_events').select('*').order('created_at',{ascending:false}).limit(200).then(({data})=>setRows(data||[]))},[]);
 return <main className="container"><Link href="/admin">← Admin</Link><h1>🛡️ Competition Integrity</h1><p>Review suspicious client events and anti-cheat evidence.</p><div className="admin-table">{rows.map(x=><div className="admin-row" key={x.id}><div><strong>{x.event_type}</strong><small>{x.severity}</small></div><span>{new Date(x.created_at).toLocaleString()}</span></div>)}</div></main>
}
