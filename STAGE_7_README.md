
# GOSPEL TALES LIFESYTE — STAGE 7
## Competition, Payments, Prizes & Certificates

### Included

- Competition registration
- Competition entry rules
- Free-entry competition flow
- Paid-entry payment-record foundation
- Competition attempt storage
- Timed competition quiz
- Automatic score calculation
- Competition result page
- Ranking database
- Prize award database
- Winner workflow foundation
- Competition certificate records
- Certificate verification codes
- Public certificate verification
- User notifications
- Admin competition/payment/ranking/prize/certificate/notification surfaces
- Supabase RLS

### Payment security

This stage deliberately does **not** place payment secrets in browser code.

For production paid competitions, connect Paystack, Flutterwave or another supported payment provider through a secure server-side endpoint/webhook. The browser should never contain secret keys.

The database supports:
- provider
- provider reference
- amount
- currency
- successful/failed/refunded status
- payment metadata

### Competition ranking

Recommended final ranking rule:
1. Highest score first.
2. Lowest completion time as tie-breaker.
3. Only submitted, eligible attempts count.
4. Disqualified registrations/attempts are excluded.

The `competition_rankings` table is designed as a final snapshot so rankings remain auditable after a competition closes.

### Certificates

Certificates use:
- unique certificate number
- unique verification code
- recipient name
- competition
- certificate type
- issue date
- issued/revoked status

The `/certificates/verify` page verifies a certificate without exposing private learner information.

### Database setup

Run:
1. `supabase/schema.sql`
2. `supabase/stage5.sql`
3. `supabase/stage6_content.sql`
4. `supabase/stage7_competitions.sql`

### Production work still required

Before accepting real money:
- Connect a payment provider using server-side APIs/webhooks.
- Verify webhook signatures.
- Make payment status idempotent.
- Prevent duplicate successful payments.
- Add transaction reconciliation.
- Complete server-side competition scoring/ranking.
- Add stronger anti-cheat controls.
- Add proper admin CRUD/editor workflows.
- Configure certificate PDF generation/storage.
- Configure email/SMS/push notification provider.
- Add privacy, refund and competition terms.

### Next stage

Stage 8 should focus on production deployment and mobile apps:
- production Supabase setup
- domain
- Vercel/hosting deployment
- Android build
- iPhone/iOS build
- app icons and splash screens
- push notifications
- analytics
- store submission preparation
