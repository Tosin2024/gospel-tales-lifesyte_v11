import { NextResponse } from 'next/server';
import { requireUser, supabaseAdmin } from '../../../../lib/server/supabase-admin';
import { makeReference } from '../../../../lib/server/payment';

export async function POST(request) {
  try {
    const user = await requireUser(request);
    if (!user) return NextResponse.json({error:'Authentication required'}, {status:401});
    const body = await request.json();
    const { competitionId, provider='paystack' } = body;
    if (!competitionId || !['paystack','flutterwave'].includes(provider)) return NextResponse.json({error:'Invalid request'}, {status:400});
    const sb = supabaseAdmin();
    const { data: c, error: ce } = await sb.from('competitions').select('*').eq('id',competitionId).single();
    if (ce || !c) return NextResponse.json({error:'Competition not found'}, {status:404});
    if (Number(c.entry_fee) <= 0) return NextResponse.json({error:'This competition is free'}, {status:400});
    const { data: reg, error: re } = await sb.from('competition_registrations').upsert({competition_id:competitionId,user_id:user.id,status:'pending'}, {onConflict:'competition_id,user_id'}).select().single();
    if (re) throw re;
    const reference = makeReference('GTL-COMP');
    const amountMinor = Math.round(Number(c.entry_fee) * 100);
    const { error: pe } = await sb.from('competition_payments').insert({registration_id:reg.id,user_id:user.id,amount:Number(c.entry_fee),currency:c.currency || 'NGN',provider,provider_reference:reference,status:'pending',metadata:{competition_id:competitionId}});
    if (pe) throw pe;
    if (provider === 'paystack') {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured');
      const r = await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,amount:String(amountMinor),currency:c.currency || 'NGN',reference,callback_url:`${process.env.NEXT_PUBLIC_SITE_URL}/payment/callback?provider=paystack&reference=${encodeURIComponent(reference)}`,metadata:{competition_id:competitionId,registration_id:reg.id}})});
      const data = await r.json();
      if (!r.ok || !data.status) return NextResponse.json({error:'Payment initialization failed',details:data}, {status:502});
      return NextResponse.json({provider,reference,authorization_url:data.data.authorization_url});
    }
    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) throw new Error('FLW_SECRET_KEY is not configured');
    const r = await fetch('https://api.flutterwave.com/v3/payments',{method:'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},body:JSON.stringify({tx_ref:reference,amount:Number(c.entry_fee),currency:c.currency || 'NGN',redirect_url:`${process.env.NEXT_PUBLIC_SITE_URL}/payment/callback?provider=flutterwave&reference=${encodeURIComponent(reference)}`,customer:{email:user.email},meta:{competition_id:competitionId,registration_id:reg.id}})});
    const data = await r.json();
    if (!r.ok || data.status !== 'success') return NextResponse.json({error:'Payment initialization failed',details:data}, {status:502});
    return NextResponse.json({provider,reference,authorization_url:data.data.link});
  } catch (e) { return NextResponse.json({error:e.message || 'Server error'}, {status:500}); }
}
