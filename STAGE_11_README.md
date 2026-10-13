# GOSPEL TALES LIFESYTE — STAGE 11
## Live Business Integration

Stage 11 upgrades V10 from an operations foundation toward production transaction handling.

### Included
- Paystack server-side transaction initialization and verification.
- Flutterwave Standard server-side transaction initialization and verification.
- Paystack HMAC-SHA512 webhook validation and idempotency.
- Flutterwave webhook signature validation and idempotency.
- Payment amount/currency/reference validation before registration is activated.
- Server-side competition question selection.
- Server-side competition scoring and time enforcement.
- Competition answer-event evidence for integrity review.
- Existing V9 finalization and V10 certificate/operations foundations retained.

### Important security model
- Payment secret keys are server-only.
- Browser/mobile clients never decide whether payment succeeded.
- Browser/mobile clients never submit a trusted score.
- Webhook events are stored with provider + event ID and are processed once.
- Provider APIs are re-queried before payment value is granted.

### Provider configuration
Paystack's current transaction API initializes on the backend and verifies by reference. Its webhooks use `x-paystack-signature` with HMAC-SHA512. Flutterwave's current Standard flow creates checkout server-side and requires transaction verification; current webhook documentation supports signed webhook validation. See the provider documentation linked in the project delivery notes.

### Supabase
Run, in order if not already run:
1. `schema.sql`
2. `stage5.sql`
3. `stage6_content.sql`
4. `stage7_competitions.sql`
5. `stage9_production.sql`
6. `stage10_admin_operations.sql`
7. `stage11_live_business.sql`

### Environment
Copy `.env.stage11.example` values into the deployment environment. Do not commit secrets.

### Webhook URLs
- `https://YOUR_DOMAIN/api/payments/paystack/webhook`
- `https://YOUR_DOMAIN/api/payments/flutterwave/webhook`

Configure the same secret/hash values in the payment-provider dashboards.

### Still required before public launch
- Replace all placeholder certificate PDF generation with a production PDF/storage implementation.
- Configure production Supabase project and RLS review.
- Configure Paystack/Flutterwave live credentials and merchant verification.
- Configure email/SMS/WhatsApp/push provider if those channels are required.
- Complete legal/privacy/terms/prize and payment policies appropriate to Nigeria.
- Run staging payment tests, webhook retry tests, duplicate webhook tests, timeout tests and competition abuse tests.
- Deploy to a production host and perform final security review.

**Stage 11 is production-ready code architecture, not a claim that the app is already publicly deployed or that payment credentials are active.**
