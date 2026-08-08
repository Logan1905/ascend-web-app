-- ============================================================================
-- Workout tracking preference
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Captured as the final question of the Progress setup. When false the user
-- still gets the Journal for normal notes, just without workout tracking.
-- Defaults to false so an unanswered profile is never treated as opted in.
-- ============================================================================

alter table public.user_profiles
  add column if not exists track_workouts boolean not null default false;
