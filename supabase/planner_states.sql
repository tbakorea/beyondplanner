create table if not exists public.planner_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.planner_states
drop column if exists device_id;

alter table public.planner_states enable row level security;

grant select, insert, update, delete on table public.planner_states to authenticated;

drop policy if exists "planner_states_select_own" on public.planner_states;
drop policy if exists "planner_states_insert_own" on public.planner_states;
drop policy if exists "planner_states_update_own" on public.planner_states;
drop policy if exists "planner_states_delete_own" on public.planner_states;

create policy "planner_states_select_own"
on public.planner_states
for select
to authenticated
using (auth.uid() = user_id);

create policy "planner_states_insert_own"
on public.planner_states
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "planner_states_update_own"
on public.planner_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "planner_states_delete_own"
on public.planner_states
for delete
to authenticated
using (auth.uid() = user_id);
