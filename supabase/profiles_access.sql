do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'user_role'
  ) then
    create type public.user_role as enum ('admin', 'editor', 'reader');
  end if;
end
$$;

drop trigger if exists guard_profile_updates on public.profiles;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  avatar_url text,
  email text,
  province text,
  role public.user_role not null default 'editor',
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists province text,
  add column if not exists role public.user_role not null default 'editor',
  add column if not exists created_at timestamptz not null default timezone('utc', now());

update public.profiles
set role = 'admin'::public.user_role
where province = 'Administração Geral'
  and role is distinct from 'admin'::public.user_role;

create index if not exists profiles_province_idx
  on public.profiles (province, role, created_at desc);

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    case
      when coalesce(
        auth.jwt() -> 'user_metadata' ->> 'role',
        auth.jwt() -> 'raw_user_meta_data' ->> 'role'
      ) in ('admin', 'editor', 'reader') then
        coalesce(
          auth.jwt() -> 'user_metadata' ->> 'role',
          auth.jwt() -> 'raw_user_meta_data' ->> 'role'
        )::public.user_role
      else 'reader'::public.user_role
    end
  );
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

create or replace function public.can_manage_units()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_user_role() in (
    'admin'::public.user_role,
    'editor'::public.user_role
  );
$$;

create or replace function public.can_manage_users()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_user_role() = 'admin'::public.user_role;
$$;

create or replace function public.resolve_new_user_role(raw_role text)
returns public.user_role
language sql
immutable
set search_path = public
as $$
  select case
    when lower(coalesce(raw_role, '')) in ('admin', 'editor', 'reader') then
      lower(raw_role)::public.user_role
    else 'editor'::public.user_role
  end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_role public.user_role;
begin
  next_role := public.resolve_new_user_role(
    case
      when new.raw_user_meta_data ->> 'province' = 'Administração Geral' then 'admin'
      else new.raw_user_meta_data ->> 'role'
    end
  );

  insert into public.profiles (id, name, avatar_url, email, province, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    null,
    new.email,
    new.raw_user_meta_data ->> 'province',
    next_role
  )
  on conflict (id) do update
  set
    name = coalesce(public.profiles.name, excluded.name),
    email = excluded.email,
    province = coalesce(public.profiles.province, excluded.province),
    role = coalesce(public.profiles.role, excluded.role);

  return new;
end;
$$;

create or replace function public.guard_profile_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.email is distinct from old.email then
    raise exception 'Email cannot be changed from the profiles table.';
  end if;

  if new.province is distinct from old.province then
    raise exception 'Province cannot be changed from the profiles table.';
  end if;

  if auth.uid() = old.id then
    if new.role is distinct from old.role then
      raise exception 'Users cannot change their own role.';
    end if;

    return new;
  end if;

  if public.current_user_role() <> 'admin'::public.user_role then
    raise exception 'Only general administration can manage other profiles.';
  end if;

  if new.name is distinct from old.name or new.avatar_url is distinct from old.avatar_url then
    raise exception 'General administration can only change user roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_updates on public.profiles;
create trigger guard_profile_updates
before update on public.profiles
for each row execute procedure public.guard_profile_updates();

alter table public.profiles enable row level security;

drop policy if exists "Users can view allowed profiles" on public.profiles;
create policy "Users can view allowed profiles"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.can_manage_users()
);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update allowed profiles" on public.profiles;
create policy "Users can update allowed profiles"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  or public.can_manage_users()
)
with check (
  id = auth.uid()
  or public.can_manage_users()
);

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();
