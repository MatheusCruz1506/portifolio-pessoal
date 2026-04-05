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

alter table public.profiles
  add column if not exists email text,
  add column if not exists province text,
  add column if not exists role public.user_role,
  add column if not exists created_at timestamptz not null default timezone('utc', now());

update public.profiles as profile
set
  email = coalesce(profile.email, auth_user.email),
  province = coalesce(
    profile.province,
    auth_user.raw_user_meta_data ->> 'province'
  ),
  role = coalesce(
    profile.role,
    case
      when auth_user.raw_user_meta_data ->> 'province' = 'Administração Geral' then
        'admin'::public.user_role
      when lower(coalesce(auth_user.raw_user_meta_data ->> 'role', '')) in ('admin', 'editor', 'reader') then
        lower(auth_user.raw_user_meta_data ->> 'role')::public.user_role
      else 'admin'::public.user_role
    end
  )
from auth.users as auth_user
where auth_user.id = profile.id;

update public.profiles
set role = case
  when province = 'Administração Geral' then 'admin'::public.user_role
  else 'editor'::public.user_role
end
where role is null;

alter table public.profiles
  alter column role set default 'editor'::public.user_role,
  alter column role set not null;

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

drop policy if exists "Users can view own profile" on public.profiles;
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

drop policy if exists "Users can update own profile" on public.profiles;
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

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'units'
  loop
    execute format('drop policy if exists %I on public.units', policy_name);
  end loop;
end
$$;

alter table public.units enable row level security;

create policy "Users can view province units"
on public.units
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
  or province = public.current_user_province()
);

create policy "Editors can insert province units"
on public.units
for insert
to authenticated
with check (
  (
    public.current_user_role() = 'admin'::public.user_role
    and public.can_manage_units()
  )
  or (
    province = public.current_user_province()
    and public.can_manage_units()
  )
);

create policy "Editors can update province units"
on public.units
for update
to authenticated
using (
  (
    public.current_user_role() = 'admin'::public.user_role
    and public.can_manage_units()
  )
  or (
    province = public.current_user_province()
    and public.can_manage_units()
  )
)
with check (
  (
    public.current_user_role() = 'admin'::public.user_role
    and public.can_manage_units()
  )
  or (
    province = public.current_user_province()
    and public.can_manage_units()
  )
);

create policy "Editors can delete province units"
on public.units
for delete
to authenticated
using (
  (
    public.current_user_role() = 'admin'::public.user_role
    and public.can_manage_units()
  )
  or (
    province = public.current_user_province()
    and public.can_manage_units()
  )
);

alter table public.unit_history enable row level security;

drop policy if exists "Users can view province history" on public.unit_history;
create policy "Users can view province history"
on public.unit_history
for select
to authenticated
using (
  public.current_user_role() = 'admin'::public.user_role
  or province = public.current_user_province()
);

drop policy if exists "Users can insert province history" on public.unit_history;
create policy "Users can insert province history"
on public.unit_history
for insert
to authenticated
with check (
  (
    public.current_user_role() = 'admin'::public.user_role
    and public.can_manage_units()
  )
  or (
    province = public.current_user_province()
    and public.can_manage_units()
  )
);
