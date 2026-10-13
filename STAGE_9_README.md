
# GOSPEL TALES LIFESYTE — STAGE 9
## Production Business & Automation Engine

### Added
- Payment webhook idempotency table
- Secure payment webhook route placeholder
- Competition integrity/anti-cheat event recording
- Competition finalization database procedure
- Automated ranking snapshot
- Winner flagging
- Finalization audit logging
- Prize approval workflow surface
- Certificate PDF metadata fields
- Notification helper
- Analytics event tracking
- Competition analytics view
- Admin analytics dashboard
- Admin competition finalization page
- Admin integrity/anti-cheat page
- Admin prize approval page

### Critical production security
The browser must never decide that a payment succeeded, that a user is an admin, or that a competition is finalized.

Production payment flow:
Payment provider → signed server webhook → verify signature → idempotency check → verify amount/currency/reference → update payment → register learner → notification/audit.

### Competition finalization
`public.finalize_competition()`:
- requires admin authorization
- removes/rebuilds ranking snapshot
- includes only submitted eligible attempts
- sorts by score descending
- uses completion time as tie-breaker
- flags the first three ranks as winners
- marks the competition completed
- records finalization audit information

Review and confirm the competition has closed before running it.

### Anti-cheat
The schema supports integrity events such as:
- repeated tab visibility changes
- suspicious timing
- duplicate attempt indicators
- unexpected client state
- other custom risk signals

These are evidence signals, not automatic proof of cheating. Administrators should review high-risk cases before disqualification.

### Payments
The Stage 9 webhook route intentionally returns `501` until a real provider is configured and server-side signature verification is implemented. This prevents the application from falsely treating browser requests as successful payments.

### Certificates
Certificate records now support:
- PDF URL
- template version
- verification code
- issue/revocation status

Actual PDF generation/storage should use a trusted server-side PDF workflow and private storage rules where appropriate.

### Analytics
Authenticated users can create analytics events. Admins can read analytics and competition summaries.

### Database
Run after all previous migrations:
1. schema.sql
2. stage5.sql
3. stage6_content.sql
4. stage7_competitions.sql
5. stage9_production.sql

### Next
A true production launch still requires:
- payment provider account + server-side credentials
- webhook deployment and signature verification
- production Supabase project
- production hosting/domain
- certificate PDF generation
- push/email provider
- native Android/iOS signing
- privacy/terms/refund/competition policies
- final security review
