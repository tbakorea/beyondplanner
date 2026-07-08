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

create table if not exists public.planner_state_revisions (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  state jsonb not null,
  planner_updated_at timestamptz,
  archived_at timestamptz not null default now(),
  change_type text not null check (change_type in ('update', 'delete'))
);

create index if not exists planner_state_revisions_user_archived_idx
on public.planner_state_revisions (user_id, archived_at desc);

alter table public.planner_state_revisions enable row level security;

grant select on table public.planner_state_revisions to authenticated;
grant usage, select on sequence public.planner_state_revisions_id_seq to authenticated;

drop policy if exists "planner_state_revisions_select_own" on public.planner_state_revisions;

create policy "planner_state_revisions_select_own"
on public.planner_state_revisions
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.planner_state_content_score(input_state jsonb)
returns integer
language plpgsql
stable
as $$
declare
  score integer := 0;
  row_count integer := 0;
begin
  if input_state is null then
    return 0;
  end if;

  select count(*) into row_count
  from jsonb_object_keys(coalesce(input_state->'days', '{}'::jsonb));
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_object_keys(coalesce(input_state->'weeks', '{}'::jsonb));
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_object_keys(coalesce(input_state->'months', '{}'::jsonb));
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_each(coalesce(input_state->'days', '{}'::jsonb)) day_entry
  cross join jsonb_each(coalesce(day_entry.value->'tasks', '{}'::jsonb)) task_group
  cross join jsonb_array_elements(
    case when jsonb_typeof(task_group.value) = 'array' then task_group.value else '[]'::jsonb end
  ) task
  where coalesce(task->>'text', '') <> ''
     or coalesce(task->>'delegate', '') <> ''
     or coalesce(task->>'status', '') not in ('', '미완료')
     or coalesce(task->>'done', '') = 'true';
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_each(coalesce(input_state->'days', '{}'::jsonb)) day_entry
  cross join jsonb_each(
    case when jsonb_typeof(day_entry.value->'appointments') = 'object' then day_entry.value->'appointments' else '{}'::jsonb end
  ) appointment
  where coalesce(appointment.value #>> '{}', '') <> '';
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_array_elements(coalesce(input_state->'repeats'->'priorityTasks', '[]'::jsonb)) repeat_rule
  where coalesce(repeat_rule->>'text', '') <> '';
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_array_elements(coalesce(input_state->'projects'->'items', '[]'::jsonb)) project
  where coalesce(project->>'title', '') <> ''
     or coalesce(project->>'goal', '') <> ''
     or coalesce(project->>'nextAction', '') <> ''
     or coalesce(project->>'notes', '') <> '';
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_array_elements(coalesce(input_state->'finance'->'fixed', '[]'::jsonb)) money
  where coalesce(money->>'title', '') <> ''
     or coalesce(money->>'amount', '') <> ''
     or coalesce(money->>'memo', '') <> '';
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_each(coalesce(input_state->'finance'->'months', '{}'::jsonb)) month_entry
  cross join jsonb_array_elements(
    case when jsonb_typeof(month_entry.value) = 'array' then month_entry.value else '[]'::jsonb end
  ) money
  where coalesce(money->>'title', '') <> ''
     or coalesce(money->>'amount', '') <> ''
     or coalesce(money->>'memo', '') <> '';
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_array_elements(coalesce(input_state->'customSheets'->'items', '[]'::jsonb)) sheet
  where exists (
    select 1
    from jsonb_object_keys(
      case when jsonb_typeof(sheet->'cells') = 'object' then sheet->'cells' else '{}'::jsonb end
    )
  );
  score := score + coalesce(row_count, 0);

  select count(*) into row_count
  from jsonb_array_elements(coalesce(input_state->'calendar'->'events', '[]'::jsonb)) event
  where coalesce(event->>'title', '') <> '';
  score := score + coalesce(row_count, 0);

  if coalesce(input_state->'foundation'->>'mission', '') <> '' then
    score := score + 1;
  end if;
  if coalesce(input_state->'notes'->>'freeform', '') <> '' then
    score := score + 1;
  end if;

  return score;
end;
$$;

create or replace function public.guard_planner_state_destructive_overwrite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_score integer;
  new_score integer;
begin
  if current_setting('app.allow_destructive_planner_save', true) = 'on' then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    old_score := public.planner_state_content_score(old.state);
    new_score := public.planner_state_content_score(new.state);
    if old_score >= 5 and (
      new_score = 0 or (old_score - new_score >= 10 and new_score < old_score * 0.2)
    ) then
      raise exception 'planner_state_destructive_overwrite_blocked old_score=% new_score=%', old_score, new_score
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create or replace function public.archive_planner_state_revision()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    if old.state is distinct from new.state then
      insert into public.planner_state_revisions (user_id, state, planner_updated_at, change_type)
      values (old.user_id, old.state, old.updated_at, 'update');
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.planner_state_revisions (user_id, state, planner_updated_at, change_type)
    values (old.user_id, old.state, old.updated_at, 'delete');
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists planner_states_guard_destructive_overwrite on public.planner_states;
create trigger planner_states_guard_destructive_overwrite
before update on public.planner_states
for each row
execute function public.guard_planner_state_destructive_overwrite();

drop trigger if exists planner_states_archive_revision on public.planner_states;
create trigger planner_states_archive_revision
before update or delete on public.planner_states
for each row
execute function public.archive_planner_state_revision();
