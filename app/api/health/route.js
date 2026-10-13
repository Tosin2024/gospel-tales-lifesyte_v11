import {NextResponse} from 'next/server';
export async function GET(){
 const required=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
 const missing=required.filter(k=>!process.env[k]);
 return NextResponse.json({ok:missing.length===0,app:'GOSPEL TALES LIFESYTE',stage:8,environment:process.env.NODE_ENV,missing},{status:missing.length===0?200:503});
}
