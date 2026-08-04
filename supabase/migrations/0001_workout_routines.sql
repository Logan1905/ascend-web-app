-- ============================================================================
-- Workout Routines schema
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Structure:
--   routines            One row per routine a user creates (e.g. "Push Pull Legs")
--   routine_days        Exactly one row per weekday for a routine (7 per routine)
--   routine_exercises   The exercises belonging to a single routine day
--
-- Every table is protected by Row Level Security so a user can only ever read
-- or write their own data.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- Helper: keep `updated_at` current on every update
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------------
-- routines
-- ---------------------------------------------------------------------------
create table if not exists public.routines (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 100),
  is_active   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists routines_user_id_idx
  on public.routines (user_id);

-- A user can have at most ONE active routine at a time.
create unique index if not exists routines_one_active_per_user_idx
  on public.routines (user_id)
  where is_active;

drop trigger if exists routines_set_updated_at on public.routines;
create trigger routines_set_updated_at
  before update on public.routines
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------------------------------
-- routine_days
-- ---------------------------------------------------------------------------
-- day_of_week: 1 = Monday ... 7 = Sunday (ISO 8601 weekday numbering)
create table if not exists public.routine_days (
  id            uuid primary key default gen_random_uuid(),
  routine_id    uuid not null references public.routines (id) on delete cascade,
  day_of_week   smallint not null check (day_of_week between 1 and 7),
  is_rest_day   boolean not null default false,
  label         text not null default '' check (char_length(label) <= 100),
  rest_minutes  smallint not null default 3 check (rest_minutes between 0 and 60),
  unique (routine_id, day_of_week)
);

create index if not exists routine_days_routine_id_idx
  on public.routine_days (routine_id);


-- ---------------------------------------------------------------------------
-- routine_exercises
-- ---------------------------------------------------------------------------
create table if not exists public.routine_exercises (
  id              uuid primary key default gen_random_uuid(),
  routine_day_id  uuid not null references public.routine_days (id) on delete cascade,
  name            text not null check (char_length(trim(name)) between 1 and 150),
  sets            smallint not null default 3 check (sets between 1 and 20),
  reps            text not null default '8-10' check (char_length(reps) <= 20),
  position        smallint not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists routine_exercises_day_id_idx
  on public.routine_exercises (routine_day_id, position);


-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.routines           enable row level security;
alter table public.routine_days       enable row level security;
alter table public.routine_exercises  enable row level security;


-- routines: a user owns rows where user_id = auth.uid()
drop policy if exists "routines_select_own" on public.routines;
create policy "routines_select_own" on public.routines
  for select using (auth.uid() = user_id);

drop policy if exists "routines_insert_own" on public.routines;
create policy "routines_insert_own" on public.routines
  for insert with check (auth.uid() = user_id);

drop policy if exists "routines_update_own" on public.routines;
create policy "routines_update_own" on public.routines
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "routines_delete_own" on public.routines;
create policy "routines_delete_own" on public.routines
  for delete using (auth.uid() = user_id);


-- routine_days: ownership is derived from the parent routine
drop policy if exists "routine_days_all_own" on public.routine_days;
create policy "routine_days_all_own" on public.routine_days
  for all
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_days.routine_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_days.routine_id
        and r.user_id = auth.uid()
    )
  );


-- routine_exercises: ownership is derived through routine_days -> routines
drop policy if exists "routine_exercises_all_own" on public.routine_exercises;
create policy "routine_exercises_all_own" on public.routine_exercises
  for all
  using (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_exercises.routine_day_id
        and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.routine_days d
      join public.routines r on r.id = d.routine_id
      where d.id = routine_exercises.routine_day_id
        and r.user_id = auth.uid()
    )
  );


-- ============================================================================
-- Activate a routine atomically (deactivate the others first)
-- ============================================================================
create or replace function public.set_active_routine(target_routine_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- The RLS policies above ensure this only ever touches the caller's rows.
  update public.routines
     set is_active = false
   where user_id = auth.uid()
     and is_active
     and id <> target_routine_id;

  update public.routines
     set is_active = true
   where id = target_routine_id
     and user_id = auth.uid();
end;
$$;
