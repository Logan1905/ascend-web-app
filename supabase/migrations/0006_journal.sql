-- ============================================================================
-- Journal: recorded workout results + daily journal entries
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
--   workout_logs     What the user ACTUALLY did, one row per exercise per day
--   journal_entries  One free-text journal entry per day
--
-- The planned workout (exercise, sets, rep range) is never copied here — it is
-- read from the user's routine at display time. These tables only hold what was
-- actually performed, so editing a routine never rewrites past results.
--
-- Exercises are keyed by NAME rather than by routine_exercises.id on purpose:
-- editing a routine deletes and re-inserts its exercise rows, so an FK would
-- cascade away the user's history.
--
-- Weights are stored in POUNDS. `weight_unit` only remembers which unit the
-- user was typing in so the value round-trips unchanged.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- workout_logs
-- ---------------------------------------------------------------------------
create table if not exists public.workout_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  logged_on      date not null,
  exercise_name  text not null check (char_length(trim(exercise_name)) between 1 and 150),
  weight_lbs     numeric(7, 2) check (weight_lbs >= 0 and weight_lbs < 3000),
  weight_unit    text not null default 'lbs' check (weight_unit in ('lbs', 'kg')),
  reps_done      smallint check (reps_done >= 0 and reps_done <= 1000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, logged_on, exercise_name)
);

create index if not exists workout_logs_user_date_idx
  on public.workout_logs (user_id, logged_on);

drop trigger if exists workout_logs_set_updated_at on public.workout_logs;
create trigger workout_logs_set_updated_at
  before update on public.workout_logs
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- journal_entries
-- ---------------------------------------------------------------------------
create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  entry_date  date not null,
  body        text not null default '' check (char_length(body) <= 20000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, entry_date)
);

create index if not exists journal_entries_user_date_idx
  on public.journal_entries (user_id, entry_date desc);

drop trigger if exists journal_entries_set_updated_at on public.journal_entries;
create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();


-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.workout_logs     enable row level security;
alter table public.journal_entries  enable row level security;


-- workout_logs
drop policy if exists "workout_logs_select_own" on public.workout_logs;
create policy "workout_logs_select_own" on public.workout_logs
  for select using (auth.uid() = user_id);

drop policy if exists "workout_logs_insert_own" on public.workout_logs;
create policy "workout_logs_insert_own" on public.workout_logs
  for insert with check (auth.uid() = user_id);

drop policy if exists "workout_logs_update_own" on public.workout_logs;
create policy "workout_logs_update_own" on public.workout_logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "workout_logs_delete_own" on public.workout_logs;
create policy "workout_logs_delete_own" on public.workout_logs
  for delete using (auth.uid() = user_id);


-- journal_entries
drop policy if exists "journal_entries_select_own" on public.journal_entries;
create policy "journal_entries_select_own" on public.journal_entries
  for select using (auth.uid() = user_id);

drop policy if exists "journal_entries_insert_own" on public.journal_entries;
create policy "journal_entries_insert_own" on public.journal_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "journal_entries_update_own" on public.journal_entries;
create policy "journal_entries_update_own" on public.journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "journal_entries_delete_own" on public.journal_entries;
create policy "journal_entries_delete_own" on public.journal_entries
  for delete using (auth.uid() = user_id);


-- ============================================================================
-- Grants
-- ============================================================================
-- This project has "Automatically expose new tables" disabled, so the API
-- roles need explicit grants. RLS above is what actually restricts access.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.workout_logs
  to anon, authenticated;

grant select, insert, update, delete on public.journal_entries
  to anon, authenticated;
