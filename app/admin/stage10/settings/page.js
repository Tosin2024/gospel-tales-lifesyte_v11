
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';
export default function Settings(){
 const [rows,setRows]=useState([]),[msg,setMsg]=useState('');
 async function load(){const {data}=await supabase.from('admin_settings').select('*').order('key');setRows(data||[])}
 useEffect(()=>{load()},[]);
 async function save(x){let raw=prompt(`JSON value for ${x.key}`,JSON.stringify(x.value));if(raw===null)return;try{const value=JSON.parse(raw);const {error}=await supabase.from('admin_settings').update({value,updated_at:new Date().toISOString()}).eq('key',x.key);setMsg(error?.message||'Saved');load()}catch(e){setMsg('Invalid JSON')}}
 return <main className="container"><Link href="/admin/stage10">← Operations Center</Link><h1>⚙️ Site Settings</h1>{msg&&<p>{msg}</p>}<div className="admin-table">{rows.map(x=><div className="admin-row" key={x.key}><div><strong>{x.key}</strong><small>{JSON.stringify(x.value)}</small></div><button onClick={()=>save(x)}>Edit</button></div>)}</div></main>
}
