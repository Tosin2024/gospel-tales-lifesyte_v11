# GOSPEL TALES LIFESYTE — STAGE 5

## Administration & Competition Layer

Added:
- Secure admin-role route protection
- Admin question bank
- Admin competition view
- Admin learner/user view
- Admin certificate view
- Announcements table
- Prize tracking table
- Admin audit log
- Centralized `is_admin()` database function
- RLS admin policies

## Apply Stage 5 database changes

Run `supabase/stage5.sql` in the Supabase SQL editor after `supabase/schema.sql`.

## Admin account

For the first administrator, create the account normally, then set the profile role to admin from the protected database environment:

UPDATE public.profiles
SET role='admin'
WHERE email='YOUR_ADMIN_EMAIL';

Do not expose service-role credentials in the browser.

## Next production features

1. Admin create/edit/publish question forms
2. Bible story CMS
3. Competition creation and scheduling
4. Automatic winner calculation
5. Certificate issuance workflow
6. Announcements UI
7. Prize fulfillment records
8. Payment gateway, if competitions require paid entry
9. Push/email notifications
10. Full Android/iOS packaging
