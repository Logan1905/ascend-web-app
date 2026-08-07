-- ============================================================================
-- Additional profile columns: birthday, height, sex, country
-- ============================================================================
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- These fields are collected during sign-up onboarding and displayed on the
-- Profile tab.
-- ============================================================================

alter table public.user_profiles
  add column if not exists birthday     date,
  add column if not exists height_cm    numeric(5, 1) check (height_cm > 0 and height_cm < 300),
  add column if not exists height_unit  text not null default 'in' check (height_unit in ('in', 'cm')),
  add column if not exists sex          text check (sex in ('male', 'female')),
  add column if not exists country      text check (country in ('US', 'MX'));
