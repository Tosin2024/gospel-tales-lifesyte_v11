
-- GOSPEL TALES LIFESYTE — STAGE 6: COMPLETE BIBLE CONTENT SYSTEM
-- Run after schema.sql and stage5.sql.

create extension if not exists pgcrypto;

create table if not exists public.content_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  content_type text not null default 'general'
    check (content_type in ('general','story','lesson','devotional','memory_verse')),
  created_at timestamptz not null default now()
);

create table if not exists public.bible_stories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.content_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  bible_reference text,
  summary text,
  cover_image_url text,
  age_group text default 'general',
  difficulty text default 'beginner'
    check (difficulty in ('beginner','intermediate','advanced')),
  content text not null,
  key_lesson text,
  published boolean not null default false,
  featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.story_sections (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.bible_stories(id) on delete cascade,
  title text,
  body text not null,
  sort_order integer not null default 0
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.content_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  bible_reference text,
  objective text,
  introduction text,
  content text not null,
  application text,
  published boolean not null default false,
  featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memory_verses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.content_categories(id) on delete set null,
  verse_reference text not null,
  verse_text text not null,
  translation text default 'KJV',
  reflection text,
  published boolean not null default false,
  featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.devotionals (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.content_categories(id) on delete set null,
  title text not null,
  devotional_date date,
  bible_reference text,
  scripture_text text,
  body text not null,
  reflection text,
  prayer text,
  action_point text,
  published boolean not null default false,
  featured boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('story','lesson','devotional','memory_verse')),
  content_id uuid not null,
  created_at timestamptz not null default now(),
  unique(user_id, content_type, content_id)
);

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content_type text not null check (content_type in ('story','lesson','devotional','memory_verse')),
  content_id uuid not null,
  status text not null default 'started'
    check (status in ('started','completed')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  last_position integer default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, content_type, content_id)
);

create index if not exists bible_stories_published_idx on public.bible_stories(published, featured);
create index if not exists lessons_published_idx on public.lessons(published, featured);
create index if not exists devotionals_date_idx on public.devotionals(devotional_date, published);
create index if not exists memory_verses_published_idx on public.memory_verses(published, featured);
create index if not exists favorites_user_idx on public.content_favorites(user_id);
create index if not exists progress_user_idx on public.learning_progress(user_id);

-- Public read policies for published content.
alter table public.content_categories enable row level security;
alter table public.bible_stories enable row level security;
alter table public.story_sections enable row level security;
alter table public.lessons enable row level security;
alter table public.memory_verses enable row level security;
alter table public.devotionals enable row level security;
alter table public.content_favorites enable row level security;
alter table public.learning_progress enable row level security;

drop policy if exists "Published stories are public" on public.bible_stories;
create policy "Published stories are public" on public.bible_stories
for select using (published = true or public.is_admin());

drop policy if exists "Published story sections are public" on public.story_sections;
create policy "Published story sections are public" on public.story_sections
for select using (
  exists(select 1 from public.bible_stories s where s.id=story_id and (s.published=true or public.is_admin()))
);

drop policy if exists "Published lessons are public" on public.lessons;
create policy "Published lessons are public" on public.lessons
for select using (published = true or public.is_admin());

drop policy if exists "Published memory verses are public" on public.memory_verses;
create policy "Published memory verses are public" on public.memory_verses
for select using (published = true or public.is_admin());

drop policy if exists "Published devotionals are public" on public.devotionals;
create policy "Published devotionals are public" on public.devotionals
for select using (published = true or public.is_admin());

drop policy if exists "Categories are public" on public.content_categories;
create policy "Categories are public" on public.content_categories
for select using (true);

-- Admin management policies.
drop policy if exists "Admins manage stories" on public.bible_stories;
create policy "Admins manage stories" on public.bible_stories
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage story sections" on public.story_sections;
create policy "Admins manage story sections" on public.story_sections
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage lessons" on public.lessons;
create policy "Admins manage lessons" on public.lessons
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage memory verses" on public.memory_verses;
create policy "Admins manage memory verses" on public.memory_verses
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage devotionals" on public.devotionals;
create policy "Admins manage devotionals" on public.devotionals
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins manage categories" on public.content_categories;
create policy "Admins manage categories" on public.content_categories
for all using (public.is_admin()) with check (public.is_admin());

-- User-owned favorites and progress.
drop policy if exists "Users read own favorites" on public.content_favorites;
create policy "Users read own favorites" on public.content_favorites
for select using (auth.uid() = user_id);

drop policy if exists "Users add own favorites" on public.content_favorites;
create policy "Users add own favorites" on public.content_favorites
for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own favorites" on public.content_favorites;
create policy "Users delete own favorites" on public.content_favorites
for delete using (auth.uid() = user_id);

drop policy if exists "Users read own progress" on public.learning_progress;
create policy "Users read own progress" on public.learning_progress
for select using (auth.uid() = user_id);

drop policy if exists "Users create own progress" on public.learning_progress;
create policy "Users create own progress" on public.learning_progress
for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own progress" on public.learning_progress;
create policy "Users update own progress" on public.learning_progress
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed categories.
insert into public.content_categories(name,slug,description,content_type) values
('Bible Stories','bible-stories','Biblical narratives and character stories.','story'),
('Faith & Christian Living','faith-christian-living','Lessons for practical Christian growth.','lesson'),
('Prayer & Devotion','prayer-devotion','Daily devotionals for prayer and spiritual growth.','devotional'),
('Memory Verses','memory-verses','Scriptures to learn, meditate on and live by.','memory_verse')
on conflict (slug) do nothing;

-- Seed sample stories.
insert into public.bible_stories(title,slug,bible_reference,summary,content,key_lesson,published,featured)
values
('Noah and the Ark','noah-and-the-ark','Genesis 6–9',
'Noah obeyed God when the world around him was going in the opposite direction.',
'God told Noah to build an ark because judgment was coming through the flood. Noah believed God and obeyed the instructions he received. He entered the ark with his family and the animals God preserved. After the flood, God established His covenant with Noah and gave the rainbow as a sign.',
'Faith is demonstrated through obedience to God, even when others do not understand.',
true,true),
('David and Goliath','david-and-goliath','1 Samuel 17',
'David trusted God when he faced a giant that frightened an entire army.',
'Goliath challenged Israel, but David remembered that the living God was greater than the giant. David refused Saul’s armor, took his sling and five smooth stones, and went out in faith. God gave David victory.',
'Do not measure your strength only by what you see; trust the God who is greater than every giant.',
true,true),
('Esther: Courage for a Purpose','esther-courage-for-a-purpose','Esther 4–8',
'Esther risked her position to stand for God’s people.',
'Esther became queen at a time when her people faced danger. Mordecai reminded her that she may have been placed in her position for a purpose. Esther prayed, acted courageously and approached the king. God used her courage to bring deliverance.',
'God can place you where you are so that you can serve His purpose with courage and wisdom.',
true,false),
('Joseph: From Pit to Purpose','joseph-from-pit-to-purpose','Genesis 37–50',
'Joseph remained faithful through betrayal, slavery and prison before God raised him to leadership.',
'Joseph’s brothers sold him, yet God remained with him. Through years of hardship, Joseph developed wisdom and integrity. God eventually elevated him to leadership in Egypt, where he helped preserve many lives and forgave his brothers.',
'God can work through difficult seasons and turn suffering into a testimony and a platform for service.',
true,false),
('The Good Samaritan','the-good-samaritan','Luke 10:25–37',
'Jesus taught that love for our neighbour must be practical and compassionate.',
'A man was attacked by robbers and left wounded. Several religious people passed by, but a Samaritan stopped, treated his wounds and arranged for his care. Jesus used the story to teach that genuine love crosses social barriers and acts with mercy.',
'Love your neighbour by showing practical mercy, not merely by speaking about love.',
true,false),
('The Lost Sheep','the-lost-sheep','Luke 15:1–7',
'Jesus showed the value God places on every person who is lost.',
'A shepherd with one hundred sheep noticed that one was missing. He left the ninety-nine in safety and searched until he found the lost sheep. Jesus taught that heaven rejoices when a sinner repents.',
'Every soul matters to God, and we should care about those who are far from Him.',
true,false)
on conflict (slug) do update set
summary=excluded.summary, content=excluded.content, key_lesson=excluded.key_lesson,
published=excluded.published, featured=excluded.featured, updated_at=now();

-- Seed sample lessons.
insert into public.lessons(title,slug,bible_reference,objective,introduction,content,application,published,featured)
values
('Growing in Faith','growing-in-faith','Hebrews 11:1–6',
'Understand that biblical faith trusts God and responds to His word.',
'Faith grows as we hear God’s word and act on what He says.',
'Biblical faith is not blind optimism. It is confidence in God’s character and promises. Faith produces obedience, endurance and a life that seeks to please God.',
'Choose one instruction from Scripture that you will deliberately obey this week.',
true,true),
('Forgiveness and Healing','forgiveness-and-healing','Ephesians 4:31–32; James 5:16',
'Learn why Christians are called to forgive and walk in reconciliation.',
'Unforgiveness can keep the heart trapped in yesterday, while forgiveness releases the matter to God.',
'Christian forgiveness does not call evil good. It means surrendering revenge to God and choosing mercy. Where appropriate, believers should pursue truthful reconciliation while maintaining wise boundaries.',
'Pray for grace to forgive and identify one healthy step toward peace.',
true,false),
('Walking in Wisdom','walking-in-wisdom','Proverbs 3:5–7',
'Learn to seek God’s wisdom before making important decisions.',
'Wisdom is more than knowledge; it is the ability to apply truth correctly.',
'God calls His people to trust Him, reject self-sufficiency and acknowledge Him in every area of life. Wisdom includes discernment, teachability and obedience.',
'Before your next major decision, pray, search Scripture and seek godly counsel.',
true,false)
on conflict (slug) do update set
objective=excluded.objective, introduction=excluded.introduction, content=excluded.content,
application=excluded.application, published=excluded.published, featured=excluded.featured,
updated_at=now();

insert into public.memory_verses(verse_reference,verse_text,translation,reflection,published,featured)
values
('John 3:16','For God so loved the world, that he gave his only begotten Son, that whoever believes in him should not perish, but have everlasting life.','KJV','God’s love is demonstrated through His gift of Jesus Christ.',true,true),
('Proverbs 3:5','Trust in the LORD with all your heart; and lean not on your own understanding.','KJV','Trust God even when you cannot see the whole picture.',true,false),
('Philippians 4:13','I can do all things through Christ which strengtheneth me.','KJV','Christ gives strength to face what God has called you to do.',true,false)
on conflict do nothing;

insert into public.devotionals(title,devotional_date,bible_reference,scripture_text,body,reflection,prayer,action_point,published,featured)
values
('Trust God One Day at a Time',current_date,'Proverbs 3:5–6',
'Trust in the LORD with all your heart; and lean not unto thine own understanding.',
'Today, remember that God does not ask you to understand everything before you trust Him. Bring your plans, fears and decisions before Him and allow His Word to guide your steps.',
'Where am I relying on my own understanding instead of acknowledging God?',
'Father, teach me to trust You completely. Direct my steps and help me to obey Your Word today, in Jesus’ name. Amen.',
'Write down one decision you are carrying and surrender it to God in prayer.',
true,true)
on conflict do nothing;

-- Generic updated_at trigger.
create or replace function public.set_content_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists stories_updated_at on public.bible_stories;
create trigger stories_updated_at before update on public.bible_stories
for each row execute function public.set_content_updated_at();

drop trigger if exists lessons_updated_at on public.lessons;
create trigger lessons_updated_at before update on public.lessons
for each row execute function public.set_content_updated_at();

drop trigger if exists devotionals_updated_at on public.devotionals;
create trigger devotionals_updated_at before update on public.devotionals
for each row execute function public.set_content_updated_at();
