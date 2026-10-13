
-- GOSPEL TALES LIFESYTE — STAGE 10
-- Full admin operations, payment configuration, certificate generation jobs and audit controls.
-- Run after stage9_production.sql.

create table if not exists public.payment_provider_config (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique check(provider in ('paystack','flutterwave','stripe')),
  enabled boolean not null default false,
  currency text not null default 'NGN',
  public_key text,
  webhook_endpoint text,
  test_mode boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.certificate_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.competition_certificates(id) on delete cascade,
  status text not null default 'queued'
    check(status in ('queued','processing','completed','failed')),
  attempts integer not null default 0,
  error_message text,
  pdf_url text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists cert_jobs_status_idx on public.certificate_generation_jobs(status,created_at);
create index if not exists admin_audit_entity_idx on public.admin_audit_log(entity_type,created_at desc);

alter table public.payment_provider_config enable row level security;
alter table public.certificate_generation_jobs enable row level security;
alter table public.admin_settings enable row level security;

drop policy if exists "Admins manage payment provider config" on public.payment_provider_config;
create policy "Admins manage payment provider config" on public.payment_provider_config
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage certificate jobs" on public.certificate_generation_jobs;
create policy "Admins manage certificate jobs" on public.certificate_generation_jobs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage admin settings" on public.admin_settings;
create policy "Admins manage admin settings" on public.admin_settings
for all using (public.is_admin()) with check (public.is_admin());

-- Safe payment provider settings: never store secret keys here.
insert into public.admin_settings(key,value)
values
('site', '{"name":"GOSPEL TALES LIFESYTE","currency":"NGN"}'::jsonb),
('competition', '{"default_duration_seconds":600,"default_question_count":10,"certificate_enabled":true}'::jsonb)
on conflict(key) do nothing;

-- Admin-only helper to create a certificate job.
create or replace function public.queue_certificate_generation(p_certificate_id uuid)
returns uuid
language plpgsql security definer
set search_path=public
as $$
declare v_id uuid;
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 insert into public.certificate_generation_jobs(certificate_id,status)
 values(p_certificate_id,'queued')
 returning id into v_id;
 perform public.log_admin_action('queue_certificate_generation','certificate',p_certificate_id,
   jsonb_build_object('job_id',v_id));
 return v_id;
end;
$$;

-- Generate a stable certificate identifier. PDF itself is produced server-side.
create or replace function public.issue_competition_certificate(
 p_competition_id uuid,
 p_user_id uuid,
 p_recipient_name text,
 p_type text default 'participation'
)
returns uuid
language plpgsql security definer
set search_path=public
as $$
declare
 v_id uuid;
 v_cert text;
 v_code text;
 v_rank uuid;
begin
 if not public.is_admin() then raise exception 'Admin access required'; end if;
 select id into v_rank from public.competition_rankings
 where competition_id=p_competition_id and user_id=p_user_id limit 1;

 v_cert := 'GTL-' || to_char(current_date,'YYYY') || '-' ||
           upper(substr(replace(gen_random_uuid()::text,'-',''),1,10));
 v_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,16));

 insert into public.competition_certificates(
   competition_id,user_id,ranking_id,certificate_number,certificate_type,
   recipient_name,verification_code,status
 ) values (
   p_competition_id,p_user_id,v_rank,v_cert,p_type,p_recipient_name,v_code,'issued'
 )
 returning id into v_id;

 insert into public.certificate_verifications(certificate_id,verification_code)
 values(v_id,v_code);

 perform public.queue_certificate_generation(v_id);

 perform public.log_admin_action('issue_certificate','certificate',v_id,
   jsonb_build_object('competition_id',p_competition_id,'user_id',p_user_id,'type',p_type));

 return v_id;
end;
$$;
