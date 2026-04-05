create extension if not exists pgcrypto;

alter table public.units
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz;

create index if not exists units_province_archived_idx
  on public.units (province, is_archived, created_at desc);

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'unit_history_action'
  ) then
    create type public.unit_history_action as enum (
      'created',
      'updated',
      'archived',
      'restored',
      'deleted',
      'imported'
    );
  end if;
end
$$;

create or replace function public.current_user_province()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select province from public.profiles where id = auth.uid()),
    auth.jwt() -> 'user_metadata' ->> 'province',
    auth.jwt() -> 'raw_user_meta_data' ->> 'province'
  );
$$;

create table if not exists public.unit_history (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid null,
  unit_name text not null,
  province text not null,
  action public.unit_history_action not null,
  actor_user_id uuid null references auth.users (id) on delete set null,
  actor_name text null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists unit_history_unit_id_idx
  on public.unit_history (unit_id, created_at desc);

create index if not exists unit_history_province_idx
  on public.unit_history (province, created_at desc);

alter table public.unit_history enable row level security;

drop policy if exists "Users can view province history" on public.unit_history;
create policy "Users can view province history"
on public.unit_history
for select
to authenticated
using (province = public.current_user_province());

drop policy if exists "Users can insert province history" on public.unit_history;
create policy "Users can insert province history"
on public.unit_history
for insert
to authenticated
with check (province = public.current_user_province());
