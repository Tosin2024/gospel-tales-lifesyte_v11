# GOSPEL TALES LIFESYTE — STAGE 8
## Production Deployment + Web/PWA + Mobile Preparation

### Added
- Production environment template
- Deployment health endpoint: `/api/health`
- Security response headers
- Robots and sitemap
- Installable PWA manifest and service worker
- Capacitor Android/iOS wrapper configuration
- Mobile asset checklist
- Deployment and release checklist

### Production sequence
1. Create production Supabase project.
2. Run `schema.sql`, `stage5.sql`, `stage6_content.sql`, `stage7_competitions.sql`.
3. Configure authentication redirects and admin access.
4. Deploy the Next.js project to a production host.
5. Set `.env.production` variables.
6. Set the final public domain.
7. Connect payment providers server-side with signed webhooks.
8. Test `/api/health`.
9. Test the PWA on Android/iOS.
10. Add Capacitor native projects and signed builds.
11. Complete Google Play and Apple App Store submission requirements.

### Security
Never expose:
- Supabase service-role key
- payment secret keys
- webhook secrets
- admin passwords/private credentials

Use server-side routes/functions for privileged operations.

### Payment requirement
Stage 8 prepares the deployment but does not activate real-money payment processing. Production payment integration requires secure server-side initialization, signed webhook verification, idempotency, reconciliation and refund handling.

### Current status
This is a deployment-ready foundation, not a claim that the app is already publicly hosted or published in app stores. Those steps require the owner's Supabase, hosting, domain, payment and store accounts.

### Stage 9 recommendation
Production admin CRUD, secure Paystack/Flutterwave integration, automated ranking/winner/certificate workflows, certificate PDF generation, notifications, anti-cheat and analytics.
