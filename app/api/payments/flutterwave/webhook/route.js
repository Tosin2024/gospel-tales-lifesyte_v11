import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { recordWebhook, markWebhookProcessed, flutterwaveSignature, timingSafeEqualText, verifyFlutterwave, fulfillPayment } from '../../../../../lib/server/payment';

export async function POST(request) {
  const raw = await request.text();
  const secretHash = process.env.FLW_SECRET_HASH;
  const signature = request.headers.get('flutterwave-signature') || request.headers.get('verif-hash');
  if (!secretHash || !timingSafeEqualText(signature, flutterwaveSignature(raw, secretHash)) && !timingSafeEqualText(signature, secretHash)) return NextResponse.json({error:'Invalid signature'},{status:401});
  let body; try { body=JSON.parse(raw); } catch { return NextResponse.json({error:'Invalid JSON'},{status:400}); }
  const eventId = String(body.data?.id || body.data?.tx_ref || crypto.randomUUID());
  const rec = await recordWebhook({provider:'flutterwave',eventId,eventType:body.event,payload:body,signatureValid:true});
  if (rec.duplicate) return NextResponse.json({received:true});
  try {
    if (body.event === 'charge.completed' && body.data?.id && body.data?.tx_ref) {
      const verified = await verifyFlutterwave(body.data.id); const tx=verified.data;
      await fulfillPayment({provider:'flutterwave',providerReference:body.data.tx_ref,status:tx.status,amount:tx.amount,currency:tx.currency,metadata:tx.meta || {transaction_id:tx.id}});
    }
    await markWebhookProcessed(rec.id);
    return NextResponse.json({received:true});
  } catch(e) { return NextResponse.json({error:e.message || 'Webhook processing failed'},{status:500}); }
}
