
# GOSPEL TALES LIFESYTE — STAGE 10
## Full Admin Operations + Payment Configuration + Certificate Center

### Added
- Full Operations Center
- Certificate Center
- Certificate generation job queue
- Certificate issuance database function
- Payment provider configuration UI
- Server-only secret-key policy
- Site settings UI
- Central audit-log viewer
- Admin operational navigation
- Server-side certificate-generation endpoint placeholder
- Server-side privileged content CRUD endpoint placeholder

### Important security rule
Stage 10 does not put Paystack/Flutterwave secret keys into the browser or database settings table.

Use environment variables:
- `PAYSTACK_SECRET_KEY`
- `FLUTTERWAVE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

These must be available only to trusted server-side code.

### Real payment activation
To activate paid competitions:
1. Create the provider account.
2. Put secret key in the hosting provider's server environment.
3. Implement payment initialization server-side.
4. Verify webhook signature.
5. Use `payment_webhook_events` for idempotency.
6. Verify amount, currency and competition registration.
7. Mark payment successful.
8. Mark registration registered.
9. Send notification and write audit record.

### Certificate generation
The database can issue certificate records and queue PDF generation. The PDF file itself should be rendered by a trusted server-side process and stored using controlled storage.

### Admin CRUD
Stage 10 provides the operations framework. Production write endpoints should always:
- authenticate the session
- verify `is_admin()`
- validate inputs
- use parameterized database operations
- write audit logs
- return safe errors

### Migration
Run:
1. schema.sql
2. stage5.sql
3. stage6_content.sql
4. stage7_competitions.sql
5. stage9_production.sql
6. stage10_admin_operations.sql

### Current status
This is the complete Stage 10 operational foundation. It is not a claim that payment providers, domain hosting, certificate storage or app-store accounts are already connected.
