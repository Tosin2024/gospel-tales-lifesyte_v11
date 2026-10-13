# GOSPEL TALES LIFESYTE — V12 Admin Backend Patch

Patch files for an existing Next.js 14 + Supabase project. It adds:
- Bible Tales CMS at `/admin/content/stories` (create, edit, publish/unpublish, feature, search and delete stories).
- Admin leaderboard at `/admin/leaderboard` (review saved quiz attempts; scores are read-only).
- Dashboard links to those sections.
- `supabase/admin_backend_update.sql` for admin RLS access.

## Install
1. Back up your existing project folder.
2. Extract this ZIP and merge its `app` and `supabase` folders into the **actual Next.js project root** (the folder containing `package.json`). Replace matching files when asked. The dashboard file is included with the new links.
3. In Supabase Dashboard → SQL Editor, run `supabase/admin_backend_update.sql`.
4. Confirm your admin account has `profiles.role = 'admin'`.
5. Confirm `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. In a terminal opened in the project root, run `npm install` if needed, then `npm run dev`. Visit `http://localhost:3000/admin` and sign in.

## Notes
- Stage 5 and Stage 6 database scripts must already be installed.
- The pages use the signed-in Supabase session and RLS. No service-role key is added to browser code.
- The leaderboard only displays records already saved in `quiz_attempts`; it cannot validate scores created by a client. Do not use client-submitted scores to award prizes/certificates until server-side score validation is implemented.
- Certificates remain a review/records area; this patch does not auto-issue certificates or generate PDFs.
- The patch has not been connected to your Supabase instance or deployed to hosting.
