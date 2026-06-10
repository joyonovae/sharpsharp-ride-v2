-- Keep public.profiles synchronized with Supabase Auth users.
-- Existing profile roles are intentionally preserved.

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name
  )
  values (
    new.id,
    lower(new.email),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    )
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

revoke all on function public.sync_auth_user_profile() from public, anon, authenticated;

drop trigger if exists sync_auth_user_profile_after_change on auth.users;

create trigger sync_auth_user_profile_after_change
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute function public.sync_auth_user_profile();

insert into public.profiles (
  id,
  email,
  full_name
)
select
  auth_user.id,
  lower(auth_user.email),
  coalesce(
    nullif(auth_user.raw_user_meta_data ->> 'full_name', ''),
    nullif(auth_user.raw_user_meta_data ->> 'name', '')
  )
from auth.users as auth_user
where auth_user.email is not null
on conflict (id) do update
set
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name);
