-- ============================================================================
-- User fitness profile + weight entries
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
--   user_profiles   One row per user: their onboarding answers (goal, weights)
--   weight_entries  One row per logged morning weight
--
-- Weights are always stored in POUNDS. The UI converts for display so the
-- lbs/kg toggle never changes what is stored.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- user_profiles
-- ---------------------------------------------------------------------------
create table if not exists public.user_profiles (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  current_weight     numeric(6, 2) not null check (current_weight > 0 and current_weight < 1500),
  starting_weight    numeric(6, 2) not null check (starting_weight > 0 and starting_weight < 1500),
  goal_weight        numeric(6, 2) check (goal_weight > 0 and goal_weight < 1500),
  weight_unit        text not null default 'lbs' check (weight_unit in ('lbs', 'kg')),
  goal               text not null check (
                       goal in ('build_muscle', 'lose_weight', 'maintain_weight', 'gain_weight', 'other')
                     ),
  goal_custom        text check (char_length(goal_custom) <= 100),
  workout_frequency  text not null check (
                       workout_frequency in ('1-2', '3-4', '5-6', 'everyday', 'varies', 'never')
                     ),
  onboarded          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- weight_entries
-- ---------------------------------------------------------------------------
-- One logged morning weight per user per day. Re-logging the same day
-- overwrites the previous value (see the unique constraint below).
create table if not exists public.weight_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  weight_lbs  numeric(6, 2) not null check (weight_lbs > 0 and weight_lbs < 1500),
  logged_on   date not null default current_date,
  created_at  timestamptz not null default now(),
  unique (user_id, logged_on)
);

create index if not exists weight_entries_user_logged_on_idx
  on public.weight_entries (user_id, logged_on desc);


-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.user_profiles   enable row level security;
alter table public.weight_entries  enable row level security;


-- user_profiles
drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own" on public.user_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own" on public.user_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_profiles_delete_own" on public.user_profiles;
create policy "user_profiles_delete_own" on public.user_profiles
  for delete using (auth.uid() = user_id);


-- weight_entries
drop policy if exists "weight_entries_select_own" on public.weight_entries;
create policy "weight_entries_select_own" on public.weight_entries
  for select using (auth.uid() = user_id);

drop policy if exists "weight_entries_insert_own" on public.weight_entries;
create policy "weight_entries_insert_own" on public.weight_entries
  for insert with check (auth.uid() = user_id);

drop policy if exists "weight_entries_update_own" on public.weight_entries;
create policy "weight_entries_update_own" on public.weight_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weight_entries_delete_own" on public.weight_entries;
create policy "weight_entries_delete_own" on public.weight_entries
  for delete using (auth.uid() = user_id);


-- ============================================================================
-- Grants
-- ============================================================================
-- This project has "Automatically expose new tables" disabled, so the API
-- roles need explicit grants. RLS above is what actually restricts access.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.user_profiles
  to anon, authenticated;

grant select, insert, update, delete on public.weight_entries
  to anon, authenticated;
