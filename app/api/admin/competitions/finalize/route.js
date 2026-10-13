
import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';

export async function POST(request){
  const body=await request.json().catch(()=>({}));
  if(!body.competition_id) return NextResponse.json({error:'competition_id required'},{status:400});
  /*
    Production implementation must use the authenticated admin session
    and a trusted server-side Supabase client. Never trust an admin flag
    supplied by the browser.
  */
  return NextResponse.json({
    ok:false,
    status:501,
    message:'Connect this route to the authenticated server-side Supabase client and call finalize_competition().',
    competition_id:body.competition_id
  },{status:501});
}
