-- Beyond Planner incremental read model.
-- planner_states remains the canonical recovery source during the migration.

create table if not exists public.planner_tasks (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_key date not null,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

create table if not exists public.planner_appointments (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_key date not null,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

create table if not exists public.planner_daily_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  day_key date not null,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, day_key)
);

create table if not exists public.planner_weeks (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key date not null,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_key)
);

create table if not exists public.planner_money_items (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.planner_projects (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.planner_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null,
  updated_at timestamptz not null default now()
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'planner_tasks', 'planner_appointments', 'planner_daily_notes',
    'planner_weeks', 'planner_money_items', 'planner_projects',
    'planner_preferences'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update_own', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete_own', table_name);
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      table_name || '_select_own', table_name
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      table_name || '_insert_own', table_name
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      table_name || '_update_own', table_name
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)',
      table_name || '_delete_own', table_name
    );
  end loop;
end
$$;

create or replace function public.sync_planner_slices(target_day date, target_week date)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  source_state jsonb;
  source_updated timestamptz;
  day_payload jsonb;
  week_payload jsonb;
  day_text text := to_char(target_day, 'YYYY-MM-DD');
  week_text text := to_char(target_week, 'YYYY-MM-DD');
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select state, updated_at
  into source_state, source_updated
  from public.planner_states
  where user_id = uid;

  if not found then
    return jsonb_build_object('ok', false, 'exists', false);
  end if;

  day_payload := coalesce(source_state->'days'->day_text, '{}'::jsonb);
  week_payload := coalesce(source_state->'weeks'->week_text, '{}'::jsonb);

  insert into public.planner_tasks (user_id, day_key, payload, source_updated_at, updated_at)
  values (uid, target_day, coalesce(day_payload->'tasks', '{}'::jsonb), source_updated, now())
  on conflict (user_id, day_key) do update
  set payload = excluded.payload, source_updated_at = excluded.source_updated_at, updated_at = now();

  insert into public.planner_appointments (user_id, day_key, payload, source_updated_at, updated_at)
  values (
    uid,
    target_day,
    jsonb_build_object(
      'appointments', coalesce(day_payload->'appointments', '{}'::jsonb),
      'appointmentMerges', coalesce(day_payload->'appointmentMerges', '{}'::jsonb),
      'autoTaskScheduleLinks', coalesce(day_payload->'autoTaskScheduleLinks', '{}'::jsonb),
      'scheduleUnit', coalesce(day_payload->'scheduleUnit', '"30"'::jsonb)
    ),
    source_updated,
    now()
  )
  on conflict (user_id, day_key) do update
  set payload = excluded.payload, source_updated_at = excluded.source_updated_at, updated_at = now();

  insert into public.planner_daily_notes (user_id, day_key, payload, source_updated_at, updated_at)
  values (
    uid,
    target_day,
    day_payload - array['tasks', 'appointments', 'appointmentMerges', 'autoTaskScheduleLinks', 'scheduleUnit'],
    source_updated,
    now()
  )
  on conflict (user_id, day_key) do update
  set payload = excluded.payload, source_updated_at = excluded.source_updated_at, updated_at = now();

  insert into public.planner_weeks (user_id, week_key, payload, source_updated_at, updated_at)
  values (uid, target_week, week_payload, source_updated, now())
  on conflict (user_id, week_key) do update
  set payload = excluded.payload, source_updated_at = excluded.source_updated_at, updated_at = now();

  insert into public.planner_money_items (user_id, payload, source_updated_at, updated_at)
  values (uid, coalesce(source_state->'finance', '{}'::jsonb), source_updated, now())
  on conflict (user_id) do update
  set payload = excluded.payload, source_updated_at = excluded.source_updated_at, updated_at = now();

  insert into public.planner_projects (user_id, payload, source_updated_at, updated_at)
  values (uid, coalesce(source_state->'projects', '{}'::jsonb), source_updated, now())
  on conflict (user_id) do update
  set payload = excluded.payload, source_updated_at = excluded.source_updated_at, updated_at = now();

  insert into public.planner_preferences (user_id, payload, source_updated_at, updated_at)
  values (
    uid,
    source_state - array['days', 'weeks', 'finance', 'projects'],
    source_updated,
    now()
  )
  on conflict (user_id) do update
  set payload = excluded.payload, source_updated_at = excluded.source_updated_at, updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'exists', true,
    'day', day_text,
    'week', week_text,
    'updatedAt', source_updated
  );
end;
$$;

create or replace function public.get_planner_today(target_day date, target_week date)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  canonical_state jsonb;
  canonical_updated timestamptz;
  tasks_payload jsonb;
  appointments_payload jsonb;
  notes_payload jsonb;
  week_payload jsonb;
  preferences_payload jsonb;
  tasks_source timestamptz;
  appointments_source timestamptz;
  notes_source timestamptz;
  week_source timestamptz;
  preferences_source timestamptz;
  ready boolean := false;
  day_text text := to_char(target_day, 'YYYY-MM-DD');
  week_text text := to_char(target_week, 'YYYY-MM-DD');
begin
  if uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select state, updated_at into canonical_state, canonical_updated
  from public.planner_states
  where user_id = uid;

  if not found then
    return jsonb_build_object('available', true, 'exists', false, 'ready', false);
  end if;

  select payload, source_updated_at into tasks_payload, tasks_source
  from public.planner_tasks where user_id = uid and day_key = target_day;
  select payload, source_updated_at into appointments_payload, appointments_source
  from public.planner_appointments where user_id = uid and day_key = target_day;
  select payload, source_updated_at into notes_payload, notes_source
  from public.planner_daily_notes where user_id = uid and day_key = target_day;
  select payload, source_updated_at into week_payload, week_source
  from public.planner_weeks where user_id = uid and week_key = target_week;
  select payload, source_updated_at into preferences_payload, preferences_source
  from public.planner_preferences where user_id = uid;

  ready := coalesce(tasks_source = canonical_updated, false)
    and coalesce(appointments_source = canonical_updated, false)
    and coalesce(notes_source = canonical_updated, false)
    and coalesce(week_source = canonical_updated, false)
    and coalesce(preferences_source = canonical_updated, false);

  -- The canonical planner row remains the source of truth throughout the
  -- rollout. A user gets a compact Today response even before slice rows have
  -- been backfilled, so enabling this migration can never produce blanks.
  if not ready then
    return jsonb_build_object(
      'available', true,
      'exists', true,
      'ready', true,
      'source', 'canonical-fallback',
      'updatedAt', canonical_updated,
      'day', coalesce(canonical_state->'days'->day_text, '{}'::jsonb),
      'week', coalesce(canonical_state->'weeks'->week_text, '{}'::jsonb),
      'preferences', canonical_state - array['days', 'weeks', 'finance', 'projects']
    );
  end if;

  return jsonb_build_object(
    'available', true,
    'exists', true,
    'ready', ready,
    'source', 'slice',
    'updatedAt', canonical_updated,
    'day', coalesce(notes_payload, '{}'::jsonb)
      || jsonb_build_object('tasks', coalesce(tasks_payload, '{}'::jsonb))
      || coalesce(appointments_payload, '{}'::jsonb),
    'week', coalesce(week_payload, '{}'::jsonb),
    'preferences', coalesce(preferences_payload, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.sync_planner_slices(date, date) to authenticated;
grant execute on function public.get_planner_today(date, date) to authenticated;
