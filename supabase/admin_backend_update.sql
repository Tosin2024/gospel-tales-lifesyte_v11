-- GOSPEL TALES LIFESYTE: admin backend update
-- Run after schema.sql, stage5.sql and stage6_content.sql in Supabase SQL Editor.

-- Admin leaderboard needs display names for learners with recorded attempts.
alter table public.profiles enable row level security;
drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
on public.profiles for select
using (public.is_admin());

alter table public.quiz_attempts enable row level security;
drop policy if exists "Admins read all quiz attempts" on public.quiz_attempts;
create policy "Admins read all quiz attempts"
on public.quiz_attempts for select
using (public.is_admin());

alter table public.bible_stories enable row level security;
drop policy if exists "Admins manage stories" on public.bible_stories;
create policy "Admins manage stories"
on public.bible_stories for all
using (public.is_admin())
with check (public.is_admin());

alter table public.certificates enable row level security;
drop policy if exists "admins manage certificates" on public.certificates;
create policy "admins manage certificates"
on public.certificates for all
using (public.is_admin())
with check (public.is_admin());
