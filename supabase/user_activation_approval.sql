alter table public.profiles
  add column if not exists approved boolean;

update public.profiles
set approved = true
where approved is null;

alter table public.profiles
  alter column approved set default false,
  alter column approved set not null;

update public.profiles
set role = 'admin'::public.user_role
where province = 'Administração Geral'
  and role is distinct from 'admin'::public.user_role;

insert into public.profiles (id, name, avatar_url, email, province, role, approved)
select
  auth_user.id,
  auth_user.raw_user_meta_data ->> 'name',
  null,
  auth_user.email,
  auth_user.raw_user_meta_data ->> 'province',
  public.resolve_new_user_role(
    case
      when auth_user.raw_user_meta_data ->> 'province' = 'Administração Geral' then 'admin'
      else auth_user.raw_user_meta_data ->> 'role'
    end
  ),
  false
from auth.users as auth_user
left join public.profiles as profile
  on profile.id = auth_user.id
where profile.id is null;

create index if not exists profiles_approved_idx
  on public.profiles (approved, created_at desc);

create or replace function public.current_user_is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select approved from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.current_user_is_approved() then
      coalesce(
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
      )
    else 'reader'::public.user_role
  end;
$$;

create or replace function public.current_user_province()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.current_user_is_approved() then
      coalesce(
        (select province from public.profiles where id = auth.uid()),
        auth.jwt() -> 'user_metadata' ->> 'province',
        auth.jwt() -> 'raw_user_meta_data' ->> 'province'
      )
    else null
  end;
$$;

create or replace function public.can_manage_units()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.current_user_is_approved()
    and public.current_user_role() in (
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
  select public.current_user_is_approved()
    and public.current_user_role() = 'admin'::public.user_role;
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

  insert into public.profiles (id, name, avatar_url, email, province, role, approved)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    null,
    new.email,
    new.raw_user_meta_data ->> 'province',
    next_role,
    false
  )
  on conflict (id) do update
  set
    name = coalesce(public.profiles.name, excluded.name),
    email = excluded.email,
    province = coalesce(public.profiles.province, excluded.province),
    role = coalesce(public.profiles.role, excluded.role),
    approved = coalesce(public.profiles.approved, excluded.approved);

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

    if new.approved is distinct from old.approved then
      raise exception 'Users cannot change their own approval status.';
    end if;

    return new;
  end if;

  if public.current_user_role() <> 'admin'::public.user_role then
    raise exception 'Only general administration can manage other profiles.';
  end if;

  if new.name is distinct from old.name or new.avatar_url is distinct from old.avatar_url then
    raise exception 'General administration can only change user roles and approval status.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();
