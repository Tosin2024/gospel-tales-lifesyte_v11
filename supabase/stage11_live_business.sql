-- GOSPEL TALES LIFESYTE — STAGE 11
-- Live payments, server-side competition integrity and production workflow helpers.

create extension if not exists pgcrypto;

alter table public.competition_attempts
  add column if not exists server_question_ids jsonb not null default '[]'::jsonb,
  add column if not exists last_activity_at timestamptz,
  add column if not exists integrity_score integer not null default 100;

create table if not exists public.competition_answer_events (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.competition_attempts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  selected_answer text,
  answered_at timestamptz not null default now(),
  elapsed_seconds integer not null default 0,
  unique(attempt_id, question_id)
);

create index if not exists answer_events_attempt_idx on public.competition_answer_events(attempt_id,answered_at);
alter table public.competition_answer_events enable row level security;
drop policy if exists "Users read own answer events" on public.competition_answer_events;
create policy "Users read own answer events" on public.competition_answer_events for select using(auth.uid()=user_id or public.is_admin());
drop policy if exists "Users create own answer events" on public.competition_answer_events;
create policy "Users create own answer events" on public.competition_answer_events for insert with check(auth.uid()=user_id);
drop policy if exists "Admins manage answer events" on public.competition_answer_events;
create policy "Admins manage answer events" on public.competition_answer_events for all using(public.is_admin()) with check(public.is_admin());

-- This RPC chooses the question IDs on the server and never returns correct answers.
create or replace function public.start_competition_attempt(p_competition uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c record; reg record; a record; ids jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into c from competitions where id=p_competition;
  if not found then raise exception 'Competition not found'; end if;
  if c.status not in ('published','active','open') then raise exception 'Competition is not open'; end if;
  if c.starts_at is not null and now() < c.starts_at then raise exception 'Competition has not started'; end if;
  if c.ends_at is not null and now() > c.ends_at then raise exception 'Competition has ended'; end if;
  select * into reg from competition_registrations where competition_id=p_competition and user_id=auth.uid() and status='registered';
  if not found then raise exception 'Registration/payment is required'; end if;
  select * into a from competition_attempts where competition_id=p_competition and user_id=auth.uid();
  if found then raise exception 'Attempt already exists'; end if;
  select coalesce(jsonb_agg(x.id), '[]'::jsonb) into ids from (
    select q.id from questions q where q.is_published=true order by random() limit c.question_count
  ) x;
  if jsonb_array_length(ids) < c.question_count then raise exception 'Not enough published questions'; end if;
  insert into competition_attempts(competition_id,user_id,registration_id,started_at,last_activity_at,total_questions,server_question_ids)
  values(p_competition,auth.uid(),reg.id,now(),now(),c.question_count,ids) returning * into a;
  return jsonb_build_object('attempt_id',a.id,'question_ids',ids,'duration_seconds',c.duration_seconds,'started_at',a.started_at);
end $$;

-- Server scores submitted answers. The client never supplies a score.
create or replace function public.submit_competition_attempt(p_attempt uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a record; c record; q record; selected text; score integer:=0; answered integer:=0; elapsed integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into a from competition_attempts where id=p_attempt and user_id=auth.uid() for update;
  if not found then raise exception 'Attempt not found'; end if;
  if a.status <> 'in_progress' then raise exception 'Attempt is already submitted'; end if;
  select * into c from competitions where id=a.competition_id;
  elapsed := greatest(0,extract(epoch from (now()-a.started_at))::integer);
  if elapsed > c.duration_seconds then raise exception 'Time limit exceeded'; end if;
  for q in select id, correct_answer from questions where id in (select jsonb_array_elements_text(a.server_question_ids)::uuid) loop
    selected := nullif(trim(p_answers->>q.id::text),'');
    if selected is not null then
      answered := answered + 1;
      insert into competition_answer_events(attempt_id,user_id,question_id,selected_answer,elapsed_seconds)
      values(a.id,auth.uid(),q.id,selected,elapsed)
      on conflict(attempt_id,question_id) do update set selected_answer=excluded.selected_answer,answered_at=now();
      if selected = q.correct_answer then score := score + 1; end if;
    end if;
  end loop;
  update competition_attempts set answers=p_answers,score=score,total_questions=jsonb_array_length(server_question_ids),percentage=round((score::numeric/nullif(jsonb_array_length(server_question_ids),0))*100,2),time_seconds=elapsed,status='submitted',submitted_at=now(),last_activity_at=now() where id=a.id;
  return jsonb_build_object('attempt_id',a.id,'score',score,'total_questions',jsonb_array_length(a.server_question_ids),'percentage',round((score::numeric/nullif(jsonb_array_length(a.server_question_ids),0))*100,2),'time_seconds',elapsed);
end $$;

revoke all on function public.start_competition_attempt(uuid) from public;
grant execute on function public.start_competition_attempt(uuid) to authenticated;
revoke all on function public.submit_competition_attempt(uuid,jsonb) from public;
grant execute on function public.submit_competition_attempt(uuid,jsonb) to authenticated;
