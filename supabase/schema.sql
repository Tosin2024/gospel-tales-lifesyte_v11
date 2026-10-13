create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique,
  role text not null default 'learner' check(role in ('learner','teacher','admin')),
  points integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_categories (
  id bigint generated always as identity primary key,
  name text unique not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id bigint generated always as identity primary key,
  category_id bigint references public.quiz_categories(id),
  difficulty text not null check(difficulty in ('Beginner','Intermediate','Advanced')),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check(correct_option in ('A','B','C','D')),
  explanation text,
  status text not null default 'draft' check(status in ('draft','published','archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id bigint references public.quiz_categories(id),
  total_questions integer not null,
  correct_answers integer not null,
  score_percent numeric(5,2) not null,
  points_earned integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  certificate_number text unique not null,
  best_score_percent numeric(5,2) not null,
  issued_at timestamptz not null default now()
);

create table if not exists public.competitions (
  id bigint generated always as identity primary key,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  entry_points integer not null default 0,
  status text not null default 'draft'
);

create table if not exists public.competition_entries (
  id bigint generated always as identity primary key,
  competition_id bigint not null references public.competitions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score_percent numeric(5,2) not null,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique(competition_id,user_id)
);

alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.certificates enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;

create policy "published questions are readable"
on public.questions for select
using (status='published');

create policy "users read own profile"
on public.profiles for select
using (auth.uid()=id);

create policy "users update own profile"
on public.profiles for update
using (auth.uid()=id);

create policy "users insert own attempts"
on public.quiz_attempts for insert
with check (auth.uid()=user_id);

create policy "users read own attempts"
on public.quiz_attempts for select
using (auth.uid()=user_id);

create policy "users read own certificates"
on public.certificates for select
using (auth.uid()=user_id);

create policy "published competitions readable"
on public.competitions for select
using (status='published');

create policy "users read own competition entries"
on public.competition_entries for select
using (auth.uid()=user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id,full_name,email)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Learner'),new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace view public.leaderboard as
select p.full_name, a.score_percent, a.points_earned, a.completed_at
from public.quiz_attempts a
join public.profiles p on p.id=a.user_id
order by a.score_percent desc, a.points_earned desc, a.completed_at asc;
