
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';

export default function Analytics(){
 const [rows,setRows]=useState([]),[events,setEvents]=useState(0);
 useEffect(()=>{(async()=>{
   const {data}=await supabase.from('admin_competition_analytics').select('*').order('registrations',{ascending:false});
   setRows(data||[]);
   const {count}=await supabase.from('analytics_events').select('*',{count:'exact',head:true});
   setEvents(count||0);
 })()},[]);
 return <main className="container">
  <Link href="/admin">← Admin</Link><h1>📊 Production Analytics</h1>
  <div className="progress-stat"><strong>{events}</strong><span>recorded analytics events</span></div>
  <div className="admin-table">{rows.map(r=><div className="admin-row" key={r.id}>
    <div><strong>{r.name}</strong><small>{r.status}</small></div>
    <span>{r.registrations} registrations · {r.submissions} submissions</span>
    <span>Top: {r.top_score}</span>
  </div>)}</div>
 </main>
}
