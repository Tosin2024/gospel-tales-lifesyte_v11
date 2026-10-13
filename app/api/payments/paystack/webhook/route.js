import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { recordWebhook, markWebhookProcessed, paystackSignature, timingSafeEqualText, verifyPaystack, fulfillPayment } from '../../../../../lib/server/payment';

export async function POST(request) {
  const raw = await request.text();
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = request.headers.get('x-paystack-signature');
  if (!secret || !timingSafeEqualText(signature, paystackSignature(raw, secret))) return NextResponse.json({error:'Invalid signature'},{status:401});
  let body; try { body=JSON.parse(raw); } catch { return NextResponse.json({error:'Invalid JSON'},{status:400}); }
  const eventId = String(body.data?.id || body.data?.reference || body.event || crypto.randomUUID());
  const rec = await recordWebhook({provider:'paystack',eventId,eventType:body.event,payload:body,signatureValid:true});
  if (rec.duplicate) return NextResponse.json({received:true});
  try {
    if (body.event === 'charge.success' && body.data?.reference) {
      const verified = await verifyPaystack(body.data.reference);
      const tx=verified.data;
      await fulfillPayment({provider:'paystack',providerReference:body.data.reference,status:tx.status,amount:Number(tx.amount)/100,currency:tx.currency,metadata:tx.metadata || {}});
    }
    await markWebhookProcessed(rec.id);
    return NextResponse.json({received:true});
  } catch(e) { return NextResponse.json({error:e.message || 'Webhook processing failed'},{status:500}); }
}
