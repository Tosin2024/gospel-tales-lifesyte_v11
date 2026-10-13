import { NextResponse } from 'next/server';
import { requireUser } from '../../../../lib/server/supabase-admin';
import { verifyPaystack, verifyFlutterwave, fulfillPayment } from '../../../../lib/server/payment';

export async function POST(request) {
  try {
    const user = await requireUser(request); if (!user) return NextResponse.json({error:'Authentication required'},{status:401});
    const {provider, reference, transactionId} = await request.json();
    if (!provider || !reference) return NextResponse.json({error:'provider and reference are required'},{status:400});
    let tx;
    if (provider === 'paystack') {
      const result = await verifyPaystack(reference); tx = result.data;
      if (tx?.customer?.email && tx.customer.email !== user.email) return NextResponse.json({error:'Payment customer mismatch'},{status:403});
      const out = await fulfillPayment({provider,providerReference:reference,status:tx.status,amount:Number(tx.amount)/100,currency:tx.currency,metadata:tx.metadata || {}});
      return NextResponse.json(out);
    }
    if (provider === 'flutterwave') {
      if (!transactionId) return NextResponse.json({error:'transactionId is required for Flutterwave verification'},{status:400});
      const result = await verifyFlutterwave(transactionId); tx = result.data;
      const out = await fulfillPayment({provider,providerReference:reference,status:tx.status,amount:tx.amount,currency:tx.currency,metadata:tx.meta || {transaction_id:tx.id}});
      return NextResponse.json(out);
    }
    return NextResponse.json({error:'Unsupported provider'},{status:400});
  } catch(e) { return NextResponse.json({error:e.message || 'Verification failed'},{status:500}); }
}
