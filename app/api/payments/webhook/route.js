
import {NextResponse} from 'next/server';

/*
  STAGE 9 SECURITY PLACEHOLDER
  Connect Paystack/Flutterwave server SDKs here.
  Required production steps:
  1. Read raw request body.
  2. Verify provider webhook signature with a server-side secret.
  3. Extract provider event ID.
  4. Insert into payment_webhook_events with a unique(provider,event_id).
  5. If already processed, return 200 without repeating side effects.
  6. Verify amount, currency, registration and transaction reference.
  7. Mark competition_payments successful.
  8. Mark the registration registered.
  9. Record audit log and notification.
*/
export async function POST(){
  return NextResponse.json(
    {ok:false,message:'Payment provider webhook is not configured yet. Configure and verify the provider server-side before accepting real payments.'},
    {status:501}
  );
}
