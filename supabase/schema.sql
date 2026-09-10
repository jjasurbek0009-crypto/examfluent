-- ============================================================================
--  ExamFluent — Supabase baza sxemasi
-- ============================================================================
--
--  QANDAY ISHGA TUSHIRISH:
--    1. supabase.com → loyihangiz → chap menyudan "SQL Editor"
--    2. "New query" bosing
--    3. SHU FAYLNING HAMMASINI nusxalab, u yerga qo'ying
--    4. "Run" (yoki Ctrl+Enter) bosing
--    5. "Success. No rows returned" chiqsa — hammasi joyida.
--
--  Bu faylni qayta ishga tushirish XAVFSIZ: hamma narsa
--  "if not exists" / "drop ... if exists" bilan yozilgan.
--
--  MUHIM TUSHUNCHA — RLS (Row Level Security):
--    Bu Supabase'ning himoya tizimi. RLS yoqilganda, har bir foydalanuvchi
--    FAQAT o'zining qatorlarini ko'radi/o'zgartiradi. Shuning uchun
--    ANON KEY'ni brauzerga berish xavfsiz — kimdir uni o'g'irlasa ham,
--    boshqa odamning ma'lumotiga yeta olmaydi.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 0) Kerakli kengaytmalar
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid() uchun


-- ----------------------------------------------------------------------------
-- 1) PROFILES — foydalanuvchi profili
-- ----------------------------------------------------------------------------
-- Supabase'da foydalanuvchilar "auth.users" jadvalida saqlanadi, lekin unga
-- to'g'ridan-to'g'ri qo'shimcha ustun qo'sha olmaymiz. Shuning uchun har bir
-- user uchun "profiles" jadvalida bitta qator ochamiz (id = auth.users.id).
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text,
  full_name        text,
  avatar_url       text,

  -- Interfeys tili: 'uz' yoki 'ru'
  ui_lang          text not null default 'uz' check (ui_lang in ('uz', 'ru', 'en')),

  -- CEFR darajasi. Placement test topshirilmaguncha NULL bo'ladi.
  cefr_level       text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  placement_done   boolean not null default false,

  -- Maqsad
  target_exam      text not null default 'ielts' check (target_exam in ('ielts','general','toefl')),
  target_band      numeric(2,1),          -- masalan 7.0
  daily_goal_min   int not null default 15,

  -- Motivatsiya (streak = ketma-ket kunlar)
  streak_count     int not null default 0,
  longest_streak   int not null default 0,
  last_active_date date,
  total_xp         int not null default 0,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);


-- ----------------------------------------------------------------------------
-- 2) AVTOMATIK PROFIL YARATISH
-- ----------------------------------------------------------------------------
-- Yangi odam ro'yxatdan o'tganda (auth.users'ga qator qo'shilganda),
-- profiles jadvalida ham avtomatik qator ochiladi. Shunda kodimizda
-- "profil bormi yo'qmi" deb tekshirib o'tirmaymiz.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- "updated_at" ustunini avtomatik yangilash uchun umumiy funksiya
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ----------------------------------------------------------------------------
-- 3) PLACEMENT_ATTEMPTS — CEFR daraja aniqlash testi natijalari
-- ----------------------------------------------------------------------------
create table if not exists public.placement_attempts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,

  answers          jsonb not null,        -- [{questionId, chosen, correct, level, skill}]
  raw_score        int not null,
  total_questions  int not null,
  cefr_level       text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),

  -- Ko'nikmalar bo'yicha tafsilot: {"grammar": 0.8, "vocabulary": 0.6, "reading": 0.7}
  breakdown        jsonb,
  -- AI yozgan qisqa izoh (foydalanuvchi tilida)
  ai_summary       text,

  created_at       timestamptz not null default now()
);

create index if not exists placement_attempts_user_idx
  on public.placement_attempts (user_id, created_at desc);

alter table public.placement_attempts enable row level security;

drop policy if exists "placement_own" on public.placement_attempts;
create policy "placement_own" on public.placement_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 4) CHAT_SESSIONS + CHAT_MESSAGES — AI suhbatdosh
-- ----------------------------------------------------------------------------
create table if not exists public.chat_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null default 'New conversation',
  -- Suhbat ssenariysi: free_talk | ielts_speaking_p1 | job_interview | travel ...
  scenario     text not null default 'free_talk',
  cefr_level   text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  message_count int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists chat_sessions_user_idx
  on public.chat_sessions (user_id, updated_at desc);

alter table public.chat_sessions enable row level security;

drop policy if exists "chat_sessions_own" on public.chat_sessions;
create policy "chat_sessions_own" on public.chat_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists chat_sessions_touch_updated_at on public.chat_sessions;
create trigger chat_sessions_touch_updated_at
  before update on public.chat_sessions
  for each row execute function public.touch_updated_at();


create table if not exists public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.chat_sessions(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,

  -- AI topgan xatolar. Format:
  -- [{"original":"I go yesterday","corrected":"I went yesterday",
  --   "type":"grammar","explanation":"O'tgan zamon uchun 'went' ishlatiladi"}]
  corrections  jsonb,

  created_at   timestamptz not null default now()
);

create index if not exists chat_messages_session_idx
  on public.chat_messages (session_id, created_at asc);

alter table public.chat_messages enable row level security;

drop policy if exists "chat_messages_own" on public.chat_messages;
create policy "chat_messages_own" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 5) EXERCISE_ATTEMPTS — IELTS uslubidagi mashqlar va band score
-- ----------------------------------------------------------------------------
create table if not exists public.exercise_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,

  skill         text not null check (skill in ('reading','writing','listening','speaking')),
  task_type     text,                  -- 'task1' | 'task2' | 'multiple_choice' | ...
  cefr_level    text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),

  prompt        jsonb not null,        -- Mashq matni/savollari (AI generatsiya qilgan)
  user_response jsonb not null,        -- Foydalanuvchi javobi

  band_score    numeric(2,1),          -- 0.0 – 9.0
  -- IELTS 4 mezoni: {"task":6.5,"coherence":6.0,"lexical":6.5,"grammar":5.5}
  criteria      jsonb,
  feedback      jsonb,                 -- {"strengths":[...],"improvements":[...],"corrections":[...]}

  duration_sec  int,
  created_at    timestamptz not null default now()
);

create index if not exists exercise_attempts_user_idx
  on public.exercise_attempts (user_id, created_at desc);
create index if not exists exercise_attempts_skill_idx
  on public.exercise_attempts (user_id, skill, created_at desc);

alter table public.exercise_attempts enable row level security;

drop policy if exists "exercise_attempts_own" on public.exercise_attempts;
create policy "exercise_attempts_own" on public.exercise_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 6) VOCAB_CARDS — so'z kartochkalari (spaced repetition, SM-2 algoritmi)
-- ----------------------------------------------------------------------------
create table if not exists public.vocab_cards (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  word            text not null,
  part_of_speech  text,
  definition_en   text,
  example_en      text,
  translation_uz  text,
  translation_ru  text,
  cefr_level      text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  source          text default 'ai',    -- 'ai' | 'chat' | 'manual'

  -- SM-2 algoritmi maydonlari (takrorlash oralig'ini hisoblash uchun)
  ease_factor     numeric(4,2) not null default 2.50,
  interval_days   int not null default 0,
  repetitions     int not null default 0,
  lapses          int not null default 0,
  due_date        date not null default current_date,
  last_reviewed_at timestamptz,

  created_at      timestamptz not null default now(),

  -- Bir odamda bitta so'z faqat bir marta bo'lsin
  unique (user_id, word)
);

create index if not exists vocab_cards_due_idx
  on public.vocab_cards (user_id, due_date asc);

alter table public.vocab_cards enable row level security;

drop policy if exists "vocab_cards_own" on public.vocab_cards;
create policy "vocab_cards_own" on public.vocab_cards
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 7) PRONUNCIATION_ATTEMPTS — talaffuz mashqlari
-- ----------------------------------------------------------------------------
create table if not exists public.pronunciation_attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,

  target_text  text not null,          -- O'qish kerak bo'lgan jumla
  transcript   text,                   -- Web Speech API eshitgan matn
  accuracy     numeric(5,2),           -- 0–100 %
  feedback     jsonb,                  -- {"problemWords":[...], "tip":"..."}
  cefr_level   text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),

  created_at   timestamptz not null default now()
);

create index if not exists pronunciation_user_idx
  on public.pronunciation_attempts (user_id, created_at desc);

alter table public.pronunciation_attempts enable row level security;

drop policy if exists "pronunciation_own" on public.pronunciation_attempts;
create policy "pronunciation_own" on public.pronunciation_attempts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 8) DAILY_ACTIVITY — kunlik faollik (streak va grafik uchun)
-- ----------------------------------------------------------------------------
-- Har bir foydalanuvchi uchun har kunga BITTA qator. Dashboard'dagi
-- grafik va streak shu jadvaldan hisoblanadi.
-- ----------------------------------------------------------------------------
create table if not exists public.daily_activity (
  user_id        uuid not null references auth.users(id) on delete cascade,
  activity_date  date not null default current_date,

  xp             int not null default 0,
  minutes        int not null default 0,
  chat_messages  int not null default 0,
  exercises      int not null default 0,
  cards_reviewed int not null default 0,

  primary key (user_id, activity_date)
);

alter table public.daily_activity enable row level security;

drop policy if exists "daily_activity_own" on public.daily_activity;
create policy "daily_activity_own" on public.daily_activity
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 9) record_activity() — faollikni yozib, streak'ni yangilaydigan funksiya
-- ----------------------------------------------------------------------------
-- Kodimizdan bitta chaqiruv bilan hammasi bajariladi:
--    supabase.rpc('record_activity', { p_xp: 10, p_chat_messages: 1 })
--
-- Nima qiladi:
--   1. Bugungi kun uchun daily_activity qatorini yaratadi/yangilaydi
--   2. profiles.total_xp ni oshiradi
--   3. streak'ni hisoblaydi:
--        - kecha faol bo'lgan bo'lsa  → streak + 1
--        - bugun allaqachon faol      → o'zgarmaydi
--        - uzilish bo'lgan            → 1 dan qayta boshlanadi
-- ----------------------------------------------------------------------------
create or replace function public.record_activity(
  p_xp             int default 0,
  p_minutes        int default 0,
  p_chat_messages  int default 0,
  p_exercises      int default 0,
  p_cards_reviewed int default 0
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_today     date := current_date;
  v_last      date;
  v_streak    int;
  v_longest   int;
  v_profile   public.profiles;
begin
  if v_user_id is null then
    raise exception 'Avtorizatsiyadan o''tilmagan';
  end if;

  -- 1) Kunlik faollikni yozamiz (bor bo'lsa — ustiga qo'shamiz)
  insert into public.daily_activity as d
    (user_id, activity_date, xp, minutes, chat_messages, exercises, cards_reviewed)
  values
    (v_user_id, v_today, p_xp, p_minutes, p_chat_messages, p_exercises, p_cards_reviewed)
  on conflict (user_id, activity_date) do update set
    xp             = d.xp             + excluded.xp,
    minutes        = d.minutes        + excluded.minutes,
    chat_messages  = d.chat_messages  + excluded.chat_messages,
    exercises      = d.exercises      + excluded.exercises,
    cards_reviewed = d.cards_reviewed + excluded.cards_reviewed;

  -- 2) Streak'ni hisoblaymiz
  select last_active_date, streak_count, longest_streak
    into v_last, v_streak, v_longest
  from public.profiles where id = v_user_id;

  if v_last is null then
    v_streak := 1;                          -- birinchi kun
  elsif v_last = v_today then
    v_streak := greatest(v_streak, 1);      -- bugun allaqachon hisoblangan
  elsif v_last = v_today - 1 then
    v_streak := v_streak + 1;               -- kecha ham faol edi → davom etadi
  else
    v_streak := 1;                          -- uzilish bo'ldi → qaytadan
  end if;

  -- 3) Profilni yangilaymiz
  update public.profiles set
    total_xp         = total_xp + p_xp,
    streak_count     = v_streak,
    longest_streak   = greatest(coalesce(v_longest, 0), v_streak),
    last_active_date = v_today
  where id = v_user_id
  returning * into v_profile;

  return v_profile;
end;
$$;

grant execute on function public.record_activity(int, int, int, int, int) to authenticated;


-- ----------------------------------------------------------------------------
-- 10) bump_chat_session() — suhbatdagi xabarlar sonini oshiradi
-- ----------------------------------------------------------------------------
-- Nima uchun alohida funksiya? Chunki "avval o'qib, keyin yozish" usulida
-- ikkita xabar bir vaqtda kelsa, biri yo'qolib qolishi mumkin (race condition).
-- Bazaning o'zida "+ p_delta" qilish esa har doim to'g'ri ishlaydi.
-- ----------------------------------------------------------------------------
create or replace function public.bump_chat_session(
  p_session_id uuid,
  p_delta int default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.chat_sessions
     set message_count = message_count + p_delta,
         updated_at    = now()
   where id = p_session_id
     and user_id = auth.uid();   -- faqat o'z suhbatini yangilay oladi
end;
$$;

grant execute on function public.bump_chat_session(uuid, int) to authenticated;


-- ============================================================================
--  TAYYOR. Endi Supabase > Table Editor bo'limida 7 ta jadval ko'rinishi kerak:
--  profiles, placement_attempts, chat_sessions, chat_messages,
--  exercise_attempts, vocab_cards, pronunciation_attempts, daily_activity
-- ============================================================================
