-- Add a position column to routines for custom ordering.
-- Run this in the Supabase SQL Editor.

alter table public.routines
  add column if not exists position smallint not null default 0;

-- Default existing routines to order by creation date
update public.routines
set position = sub.row_num
from (
  select id, row_number() over (partition by user_id order by created_at) as row_num
  from public.routines
) as sub
where public.routines.id = sub.id;
