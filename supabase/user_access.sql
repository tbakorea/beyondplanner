create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null default '',
  tier text not null default 'staff' check (tier in ('ceo', 'director', 'manager', 'staff')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected', 'suspended')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_access_status_created_idx
on public.user_access (approval_status, created_at desc);

alter table public.user_access enable row level security;

grant select on table public.user_access to authenticated;

drop policy if exists "user_access_select_own" on public.user_access;

create policy "user_access_select_own"
on public.user_access
for select
to authenticated
using (auth.uid() = user_id);
