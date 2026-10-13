import crypto from 'node:crypto';
import { supabaseAdmin } from './supabase-admin';

export function makeReference(prefix='GTL') {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
}

export function timingSafeEqualText(a, b) {
  if (!a || !b) return false;
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

export function paystackSignature(raw, secret) {
  return crypto.createHmac('sha512', secret).update(raw).digest('hex');
}

export function flutterwaveSignature(raw, secretHash) {
  return crypto.createHmac('sha256', secretHash).update(raw).digest('base64');
}

export async function recordWebhook({provider,eventId,eventType,payload,signatureValid}) {
  const sb = supabaseAdmin();
  const { data, error } = await sb.from('payment_webhook_events')
    .insert({provider,event_id:eventId,event_type:eventType,payload,signature_valid:signatureValid})
    .select('id').single();
  if (error?.code === '23505') return { duplicate:true };
  if (error) throw error;
  return { duplicate:false, id:data.id };
}

export async function markWebhookProcessed(id) {
  await supabaseAdmin().from('payment_webhook_events').update({processed:true,processed_at:new Date().toISOString()}).eq('id',id);
}

export async function verifyPaystack(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured');
  const r = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers:{Authorization:`Bearer ${secret}`}, cache:'no-store'
  });
  if (!r.ok) throw new Error(`Paystack verification failed: ${r.status}`);
  return r.json();
}

export async function verifyFlutterwave(id) {
  const secret = process.env.FLW_SECRET_KEY;
  if (!secret) throw new Error('FLW_SECRET_KEY is not configured');
  const r = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(id)}/verify`, {
    headers:{Authorization:`Bearer ${secret}`}, cache:'no-store'
  });
  if (!r.ok) throw new Error(`Flutterwave verification failed: ${r.status}`);
  return r.json();
}

export async function fulfillPayment({provider, providerReference, status, amount, currency, metadata={}}) {
  const sb = supabaseAdmin();
  const { data: payment, error } = await sb.from('competition_payments')
    .select('*, competition_registrations!inner(competition_id,user_id,status)')
    .eq('provider', provider).eq('provider_reference', providerReference).maybeSingle();
  if (error) throw error;
  if (!payment) return { matched:false };

  if (status !== 'successful') {
    await sb.from('competition_payments').update({status:'failed',metadata}).eq('id',payment.id);
    return { matched:true, registered:false };
  }

  const expected = Number(payment.amount);
  const actual = Number(amount);
  if (payment.currency !== currency || actual < expected) {
    await sb.from('competition_payments').update({status:'failed',metadata:{...metadata,reason:'amount_or_currency_mismatch'}}).eq('id',payment.id);
    return { matched:true, registered:false, mismatch:true };
  }

  const { error: pe } = await sb.from('competition_payments').update({status:'successful',paid_at:new Date().toISOString(),metadata}).eq('id',payment.id);
  if (pe) throw pe;
  const registrationId = payment.registration_id;
  const { error: re } = await sb.from('competition_registrations').update({status:'registered'}).eq('id',registrationId);
  if (re) throw re;
  return { matched:true, registered:true, registrationId };
}
