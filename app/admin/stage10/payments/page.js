
'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {supabase} from '../../../../lib/supabase';
export default function Payments(){
 const [rows,setRows]=useState([]),[msg,setMsg]=useState('');
 async function load(){const {data}=await supabase.from('payment_provider_config').select('id,provider,enabled,currency,public_key,test_mode,updated_at').order('provider');setRows(data||[])}
 useEffect(()=>{load()},[]);
 async function toggle(x){const {error}=await supabase.from('payment_provider_config').update({enabled:!x.enabled,updated_at:new Date().toISOString()}).eq('id',x.id);setMsg(error?.message||`${x.provider} ${!x.enabled?'enabled':'disabled'}`);load()}
 async function add(provider){const {error}=await supabase.from('payment_provider_config').upsert({provider,enabled:false,currency:'NGN',test_mode:true});setMsg(error?.message||`${provider} configuration created`);load()}
 return <main className="container"><Link href="/admin/stage10">← Operations Center</Link><h1>💳 Payment Configuration</h1><p className="notice">Only non-secret provider settings are stored here. Secret keys belong in server environment variables.</p><div className="action-row"><button onClick={()=>add('paystack')}>Add Paystack</button><button onClick={()=>add('flutterwave')}>Add Flutterwave</button></div>{msg&&<p>{msg}</p>}<div className="admin-table">{rows.map(x=><div className="admin-row" key={x.id}><div><strong>{x.provider}</strong><small>{x.currency} · {x.test_mode?'Test':'Live'}</small></div><span>{x.enabled?'Enabled':'Disabled'}</span><button onClick={()=>toggle(x)}>{x.enabled?'Disable':'Enable'}</button></div>)}</div></main>
}
