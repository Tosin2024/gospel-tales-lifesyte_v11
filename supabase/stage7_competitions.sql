
-- GOSPEL TALES LIFESYTE — STAGE 7
-- Competition, payments, scoring, winners, prizes, certificates & notifications
-- Run after schema.sql, stage5.sql and stage6_content.sql.

create extension if not exists pgcrypto;

-- Competition lifecycle
alter table if exists public.competitions
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists rules text,
  add column if not exists entry_fee numeric(12,2) not null default 0,
  add column if not exists currency text not null default 'NGN',
  add column if not exists max_participants integer,
  add column if not exists question_count integer not null default 10,
  add column if not exists duration_seconds integer not null default 600,
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at timestamptz,
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_closes_at timestamptz,
  add column if not exists status text not null default 'draft',
  add column if not exists prize_summary text,
  add column if not exists certificate_enabled boolean not null default true;

update public.competitions
set slug = coalesce(slug, regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
where slug is null;

create unique index if not exists competitions_slug_uidx on public.competitions(slug);

-- Competition registration
create table if not exists public.competition_registrations (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check(status in ('pending','registered','cancelled','disqualified')),
  registered_at timestamptz not null default now(),
  unique(competition_id,user_id)
);

-- Payment records. Provider references are intentionally generic.
create table if not exists public.competition_payments (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.competition_registrations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'NGN',
  provider text not null default 'manual'
    check(provider in ('manual','paystack','flutterwave','stripe')),
  provider_reference text,
  status text not null default 'pending'
    check(status in ('pending','successful','failed','refunded')),
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists successful_provider_reference_uidx
on public.competition_payments(provider,provider_reference)
where provider_reference is not null and status='successful';

-- Attempts dedicated to competitions.
create table if not exists public.competition_attempts (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  registration_id uuid references public.competition_registrations(id) on delete set null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score integer not null default 0,
  total_questions integer not null default 0,
  percentage numeric(6,2) not null default 0,
  time_seconds integer not null default 0,
  status text not null default 'in_progress'
    check(status in ('in_progress','submitted','disqualified')),
  answers jsonb not null default '{}'::jsonb,
  unique(competition_id,user_id)
);

-- Rankings snapshot, generated after competition closes.
create table if not exists public.competition_rankings (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  attempt_id uuid not null references public.competition_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rank integer not null,
  score integer not null,
  percentage numeric(6,2) not null,
  time_seconds integer not null,
  winner boolean not null default false,
  created_at timestamptz not null default now(),
  unique(competition_id,user_id)
);

-- Prize awards
create table if not exists public.prize_awards (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  ranking_id uuid references public.competition_rankings(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  prize_id uuid references public.prizes(id) on delete set null,
  position integer not null,
  amount numeric(12,2) default 0,
  currency text default 'NGN',
  status text not null default 'pending'
    check(status in ('pending','approved','paid','cancelled')),
  payment_reference text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

-- Certificate records for competition achievements.
create table if not exists public.competition_certificates (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ranking_id uuid references public.competition_rankings(id) on delete set null,
  certificate_number text not null unique,
  certificate_type text not null default 'participation'
    check(certificate_type in ('participation','winner','excellence')),
  recipient_name text not null,
  issue_date date not null default current_date,
  verification_code text not null unique,
  status text not null default 'issued'
    check(status in ('issued','revoked')),
  created_at timestamptz not null default now(),
  unique(competition_id,user_id)
);

-- Public verification needs no private user data.
create table if not exists public.certificate_verifications (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.competition_certificates(id) on delete cascade,
  verification_code text not null unique,
  verified_count integer not null default 0,
  last_verified_at timestamptz
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'general'
    check(type in ('general','competition','payment','prize','certificate','announcement')),
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists registrations_user_idx on public.competition_registrations(user_id);
create index if not exists registrations_competition_idx on public.competition_registrations(competition_id);
create index if not exists attempts_competition_idx on public.competition_attempts(competition_id,score desc,time_seconds asc);
create index if not exists rankings_competition_idx on public.competition_rankings(competition_id,rank);
create index if not exists notifications_user_idx on public.notifications(user_id,created_at desc);

-- RLS
alter table public.competition_registrations enable row level security;
alter table public.competition_payments enable row level security;
alter table public.competition_attempts enable row level security;
alter table public.competition_rankings enable row level security;
alter table public.prize_awards enable row level security;
alter table public.competition_certificates enable row level security;
alter table public.certificate_verifications enable row level security;
alter table public.notifications enable row level security;

-- Registration
drop policy if exists "Users read own competition registrations" on public.competition_registrations;
create policy "Users read own competition registrations" on public.competition_registrations
for select using (auth.uid()=user_id or public.is_admin());

drop policy if exists "Users register themselves" on public.competition_registrations;
create policy "Users register themselves" on public.competition_registrations
for insert with check (auth.uid()=user_id);

drop policy if exists "Users cancel own registration" on public.competition_registrations;
create policy "Users cancel own registration" on public.competition_registrations
for update using (auth.uid()=user_id or public.is_admin())
with check (auth.uid()=user_id or public.is_admin());

-- Payments: users can read own; server/admin should create/update payment status.
drop policy if exists "Users read own payments" on public.competition_payments;
create policy "Users read own payments" on public.competition_payments
for select using (auth.uid()=user_id or public.is_admin());

drop policy if exists "Admins manage competition payments" on public.competition_payments;
create policy "Admins manage competition payments" on public.competition_payments
for all using (public.is_admin()) with check (public.is_admin());

-- Attempts
drop policy if exists "Users read own competition attempts" on public.competition_attempts;
create policy "Users read own competition attempts" on public.competition_attempts
for select using (auth.uid()=user_id or public.is_admin());

drop policy if exists "Users create own competition attempt" on public.competition_attempts;
create policy "Users create own competition attempt" on public.competition_attempts
for insert with check (auth.uid()=user_id);

drop policy if exists "Users submit own competition attempt" on public.competition_attempts;
create policy "Users submit own competition attempt" on public.competition_attempts
for update using (auth.uid()=user_id or public.is_admin())
with check (auth.uid()=user_id or public.is_admin());

-- Rankings are readable to authenticated users, writable only by admin.
drop policy if exists "Authenticated users read rankings" on public.competition_rankings;
create policy "Authenticated users read rankings" on public.competition_rankings
for select using (auth.uid() is not null);

drop policy if exists "Admins manage rankings" on public.competition_rankings;
create policy "Admins manage rankings" on public.competition_rankings
for all using (public.is_admin()) with check (public.is_admin());

-- Prize awards
drop policy if exists "Users read own prize awards" on public.prize_awards;
create policy "Users read own prize awards" on public.prize_awards
for select using (auth.uid()=user_id or public.is_admin());

drop policy if exists "Admins manage prize awards" on public.prize_awards;
create policy "Admins manage prize awards" on public.prize_awards
for all using (public.is_admin()) with check (public.is_admin());

-- Certificates
drop policy if exists "Users read own certificates" on public.competition_certificates;
create policy "Users read own certificates" on public.competition_certificates
for select using (auth.uid()=user_id or public.is_admin());

drop policy if exists "Admins manage competition certificates" on public.competition_certificates;
create policy "Admins manage competition certificates" on public.competition_certificates
for all using (public.is_admin()) with check (public.is_admin());

-- Public verification lookup by code.
drop policy if exists "Public verify certificates" on public.certificate_verifications;
create policy "Public verify certificates" on public.certificate_verifications
for select using (true);

drop policy if exists "Admins manage certificate verification" on public.certificate_verifications;
create policy "Admins manage certificate verification" on public.certificate_verifications
for all using (public.is_admin()) with check (public.is_admin());

-- Notifications
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications" on public.notifications
for select using (auth.uid()=user_id or public.is_admin());

drop policy if exists "Users mark own notifications read" on public.notifications;
create policy "Users mark own notifications read" on public.notifications
for update using (auth.uid()=user_id or public.is_admin())
with check (auth.uid()=user_id or public.is_admin());

drop policy if exists "Admins manage notifications" on public.notifications;
create policy "Admins manage notifications" on public.notifications
for all using (public.is_admin()) with check (public.is_admin());

-- Helper function: registration eligibility.
create or replace function public.competition_registration_open(p_competition uuid)
returns boolean
language sql stable security definer
set search_path=public
as $$
  select exists (
    select 1 from public.competitions c
    where c.id=p_competition
      and coalesce(c.status,'draft') in ('open','active')
      and (c.registration_opens_at is null or now() >= c.registration_opens_at)
      and (c.registration_closes_at is null or now() <= c.registration_closes_at)
      and (c.max_participants is null or
           (select count(*) from public.competition_registrations r
            where r.competition_id=c.id and r.status in ('pending','registered')) < c.max_participants)
  );
$$;

-- Public certificate verification function: returns only safe certificate information.
create or replace function public.verify_certificate(p_code text)
returns table (
  valid boolean,
  certificate_number text,
  recipient_name text,
  certificate_type text,
  competition_id uuid,
  issue_date date
)
language plpgsql security definer
set search_path=public
as $$
begin
  update public.certificate_verifications
  set verified_count=verified_count+1,last_verified_at=now()
  where verification_code=p_code;

  return query
  select
    c.status='issued',
    c.certificate_number,
    c.recipient_name,
    c.certificate_type,
    c.competition_id,
    c.issue_date
  from public.competition_certificates c
  where c.verification_code=p_code;
end;
$$;
