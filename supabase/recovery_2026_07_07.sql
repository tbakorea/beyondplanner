-- Beyond Work emergency recovery helper
-- Created: 2026-07-07 KST
--
-- Run this in Supabase SQL Editor before any restore attempt.
-- It creates a current snapshot first, then shows which users still have
-- planner state rows and how much content remains.

create table if not exists public.planner_states_recovery_snapshot_20260707
as
select
  user_id,
  state,
  updated_at,
  now() as snapshotted_at
from public.planner_states;

alter table public.planner_states_recovery_snapshot_20260707 enable row level security;

-- Current member/state diagnostic.
-- The Supabase SQL Editor can read auth.users; the app client cannot.
select
  u.id as user_id,
  u.email,
  ps.updated_at,
  case when ps.user_id is null then false else true end as has_state_row,
  coalesce(jsonb_object_length(coalesce(ps.state->'days', '{}'::jsonb)), 0) as day_count,
  coalesce(jsonb_array_length(coalesce(ps.state->'projects'->'items', '[]'::jsonb)), 0) as project_count,
  coalesce(jsonb_array_length(coalesce(ps.state->'customSheets'->'items', '[]'::jsonb)), 0) as sheet_count,
  coalesce(jsonb_array_length(coalesce(ps.state->'finance'->'fixed', '[]'::jsonb)), 0) as fixed_money_count,
  length(coalesce(ps.state::text, '')) as state_text_length
from auth.users u
left join public.planner_states ps on ps.user_id = u.id
order by u.created_at desc;

-- If a previous Supabase backup/PITR export is available, restore by inserting
-- rows into planner_states with the original user_id and state:
--
-- insert into public.planner_states (user_id, state, updated_at)
-- values ('USER_UUID', 'STATE_JSON'::jsonb, 'UPDATED_AT'::timestamptz)
-- on conflict (user_id) do update
-- set state = excluded.state,
--     updated_at = excluded.updated_at
-- where public.planner_states.updated_at is null
--    or excluded.updated_at >= public.planner_states.updated_at;

