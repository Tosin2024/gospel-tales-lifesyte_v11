
-- STAGE 5: Administration, announcements, prizes and audit trail

create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text not null,
  body text not null,
  audience text not null default 'all' check(audience in ('all','learners','teachers')),
  published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.prizes (
  id bigint generated always as identity primary key,
  competition_id bigint references public.competitions(id) on delete cascade,
  position integer not null,
  prize_name text not null,
  description text,
  winner_user_id uuid references public.profiles(id),
  status text not null default 'pending' check(status in ('pending','awarded','cancelled')),
  awarded_at timestamptz
);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
alter table public.prizes enable row level security;
alter table public.admin_audit_log enable row level security;

create policy "published announcements readable"
on public.announcements for select
using (published=true);

create policy "users see awarded prizes"
on public.prizes for select
using (status='awarded' or auth.uid()=winner_user_id);

-- Admin write policies use a database function so the role check is centralized.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;

create policy "admins manage questions"
on public.questions for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage competitions"
on public.competitions for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage certificates"
on public.certificates for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage announcements"
on public.announcements for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage prizes"
on public.prizes for all
using (public.is_admin())
with check (public.is_admin());

create policy "admins read audit log"
on public.admin_audit_log for select
using (public.is_admin());

create policy "admins write audit log"
on public.admin_audit_log for insert
with check (public.is_admin());
