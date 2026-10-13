
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';
export default function Audit(){
 const [rows,setRows]=useState([]);
 useEffect(()=>{supabase.from('admin_audit_log').select('*').order('created_at',{ascending:false}).limit(200).then(({data})=>setRows(data||[]))},[]);
 return <main className="container"><Link href="/admin/stage10">← Operations Center</Link><h1>🧾 Audit Log</h1><div className="admin-table">{rows.map(x=><div className="admin-row" key={x.id}><div><strong>{x.action}</strong><small>{x.entity_type} · {x.entity_id}</small></div><span>{new Date(x.created_at).toLocaleString()}</span></div>)}</div></main>
}
