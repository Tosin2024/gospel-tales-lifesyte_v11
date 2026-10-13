
-- GOSPEL TALES LIFESYTE — STAGE 9
-- Production business & automation engine
-- Run after stages 5, 6, 7 and 8.

create extension if not exists pgcrypto;

-- Payment workflow / webhook idempotency
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text,
  signature_valid boolean not null default false,
  processed boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider,event_id)
);

-- Competition integrity / anti-cheat evidence
create table if not exists public.competition_integrity_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.competition_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  severity text not null default 'info'
    check(severity in ('info','warning','high','critical')),
  created_at timestamptz not null default now()
);

create table if not exists public.competition_finalizations (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null unique references public.competitions(id) on delete cascade,
  finalized_by uuid references auth.users(id) on delete set null,
  finalized_at timestamptz not null default now(),
  participant_count integer not null default 0,
  eligible_count integer not null default 0,
  winner_count integer not null default 0,
  status text not null default 'completed'
    check(status in ('completed','failed','reopened')),
  notes text
);

-- Analytics events
create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  event_category text not null default 'general',
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_name_idx on public.analytics_events(event_name,created_at desc);
create index if not exists integrity_attempt_idx on public.competition_integrity_events(attempt_id,created_at);
create index if not exists webhook_event_idx on public.payment_webhook_events(provider,created_at);

-- Certificate PDF metadata
alter table public.competition_certificates
  add column if not exists pdf_url text,
  add column if not exists template_version text default 'v1';

-- Admin audit helper
create or replace function public.log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb default '{}'::jsonb
)
returns uuid
language plpgsql security definer
set search_path=public
as $$
declare v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;
  insert into public.admin_audit_log(admin_id,action,entity_type,entity_id,details)
  values(auth.uid(),p_action,p_entity_type,p_entity_id,p_details)
  returning id into v_id;
  return v_id;
end;
$$;

-- Secure competition finalization procedure.
-- It snapshots rankings, creates winner rows, and marks the competition completed.
-- Prize/certificate issuance can then be handled by an explicit server-side job.
create or replace function public.finalize_competition(p_competition uuid)
returns jsonb
language plpgsql security definer
set search_path=public
as $$
declare
  c record;
  a record;
  v_rank integer := 0;
  v_eligible integer := 0;
  v_participants integer := 0;
  v_winners integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select * into c from public.competitions where id=p_competition for update;
  if not found then raise exception 'Competition not found'; end if;

  select count(*) into v_participants
  from public.competition_attempts where competition_id=p_competition;

  delete from public.competition_rankings where competition_id=p_competition;

  for a in
    select ca.*
    from public.competition_attempts ca
    left join public.competition_registrations cr on cr.id=ca.registration_id
    where ca.competition_id=p_competition
      and ca.status='submitted'
      and coalesce(cr.status,'registered')='registered'
    order by ca.score desc, ca.time_seconds asc, ca.submitted_at asc
  loop
    v_rank := v_rank + 1;
    v_eligible := v_eligible + 1;
    insert into public.competition_rankings(
      competition_id,attempt_id,user_id,rank,score,percentage,time_seconds,winner
    ) values (
      p_competition,a.id,a.user_id,v_rank,a.score,a.percentage,a.time_seconds,
      case when v_rank <= 3 then true else false end
    );
  end loop;

  select count(*) into v_winners
  from public.competition_rankings
  where competition_id=p_competition and winner=true;

  update public.competitions
  set status='completed', updated_at=now()
  where id=p_competition;

  insert into public.competition_finalizations(
    competition_id,finalized_by,participant_count,eligible_count,winner_count,status
  ) values (
    p_competition,auth.uid(),v_participants,v_eligible,v_winners,'completed'
  )
  on conflict (competition_id) do update set
    finalized_by=excluded.finalized_by,
    finalized_at=now(),
    participant_count=excluded.participant_count,
    eligible_count=excluded.eligible_count,
    winner_count=excluded.winner_count,
    status='completed';

  perform public.log_admin_action(
    'finalize_competition','competition',p_competition,
    jsonb_build_object('participants',v_participants,'eligible',v_eligible,'winners',v_winners)
  );

  return jsonb_build_object(
    'competition_id',p_competition,
    'participants',v_participants,
    'eligible',v_eligible,
    'winners',v_winners,
    'status','completed'
  );
end;
$$;

-- Server-side helper for creating a notification after trusted workflows.
create or replace function public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text default 'general'
)
returns uuid
language plpgsql security definer
set search_path=public
as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  insert into public.notifications(user_id,title,message,type)
  values(p_user_id,p_title,p_message,p_type)
  returning id into v_id;
  return v_id;
end;
$$;

-- Analytics: authenticated users can record their own events.
alter table public.analytics_events enable row level security;
drop policy if exists "Users create own analytics events" on public.analytics_events;
create policy "Users create own analytics events" on public.analytics_events
for insert with check (auth.uid()=user_id or user_id is null);
drop policy if exists "Admins read analytics" on public.analytics_events;
create policy "Admins read analytics" on public.analytics_events
for select using (public.is_admin());

alter table public.competition_integrity_events enable row level security;
drop policy if exists "Users create own integrity events" on public.competition_integrity_events;
create policy "Users create own integrity events" on public.competition_integrity_events
for insert with check (auth.uid()=user_id);
drop policy if exists "Users read own integrity events" on public.competition_integrity_events;
create policy "Users read own integrity events" on public.competition_integrity_events
for select using (auth.uid()=user_id or public.is_admin());
drop policy if exists "Admins manage integrity events" on public.competition_integrity_events;
create policy "Admins manage integrity events" on public.competition_integrity_events
for all using (public.is_admin()) with check (public.is_admin());

alter table public.payment_webhook_events enable row level security;
drop policy if exists "Admins manage webhook events" on public.payment_webhook_events;
create policy "Admins manage webhook events" on public.payment_webhook_events
for all using (public.is_admin()) with check (public.is_admin());

alter table public.competition_finalizations enable row level security;
drop policy if exists "Admins manage finalizations" on public.competition_finalizations;
create policy "Admins manage finalizations" on public.competition_finalizations
for all using (public.is_admin()) with check (public.is_admin());

-- Admin-only analytics summary views.
create or replace view public.admin_competition_analytics as
select
  c.id,
  c.name,
  c.status,
  count(distinct r.user_id) as registrations,
  count(distinct a.user_id) as attempts,
  count(distinct case when a.status='submitted' then a.user_id end) as submissions,
  coalesce(avg(case when a.status='submitted' then a.percentage end),0) as average_percentage,
  coalesce(max(a.score),0) as top_score
from public.competitions c
left join public.competition_registrations r on r.competition_id=c.id
left join public.competition_attempts a on a.competition_id=c.id
group by c.id,c.name,c.status;

-- Seed demo competition if none exists.
insert into public.competitions(
  name,slug,description,rules,entry_fee,currency,question_count,duration_seconds,status,
  registration_opens_at,registration_closes_at,certificate_enabled
)
select
  'Gospel Tales Bible Challenge — Demo',
  'gospel-tales-bible-challenge-demo',
  'A demonstration Bible knowledge competition for testing the competition workflow.',
  'Answer each question once. Highest score wins; fastest submitted time breaks ties.',
  0,'NGN',10,600,'open',now(),now()+interval '30 days',true
where not exists(select 1 from public.competitions where slug='gospel-tales-bible-challenge-demo');
