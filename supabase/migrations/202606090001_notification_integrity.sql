-- Bring older notifications tables up to the schema expected by the app.
-- This migration is idempotent and preserves all existing notification rows.

alter table if exists public.notifications
  add column if not exists link text;

alter table if exists public.notifications
  add column if not exists dedupe_key text;

-- Preserve a valid legacy action_url when that older column exists.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name = 'action_url'
  ) then
    execute $sql$
      update public.notifications
      set link = action_url
      where (link is null or btrim(link) = '')
        and action_url is not null
        and btrim(action_url) <> ''
        and left(action_url, 1) = '/'
        and left(action_url, 2) <> '//'
        and strpos(action_url, E'\\') = 0
    $sql$;
  end if;
end
$$;

-- Backfill missing or invalid values without removing existing rows.
update public.notifications
set
  title = case
    when title is null or btrim(title) = '' then 'Notification'
    else title
  end,
  message = case
    when message is null or btrim(message) = '' then 'You have a new account update.'
    else message
  end,
  link = case
    when link is null
      or btrim(link) = ''
      or left(link, 1) <> '/'
      or left(link, 2) = '//'
      or strpos(link, E'\\') > 0
    then '/dashboard'
    else link
  end,
  dedupe_key = case
    when dedupe_key is null or btrim(dedupe_key) = '' then 'legacy:' || id::text
    else dedupe_key
  end;

-- Preserve duplicate rows while making their dedupe keys unique.
with ranked_duplicates as (
  select
    id,
    row_number() over (
      partition by user_id, dedupe_key
      order by id
    ) as duplicate_number
  from public.notifications
)
update public.notifications as notification
set dedupe_key = notification.dedupe_key || ':legacy:' || notification.id::text
from ranked_duplicates
where notification.id = ranked_duplicates.id
  and ranked_duplicates.duplicate_number > 1;

alter table if exists public.notifications
  alter column title set not null,
  alter column message set not null,
  alter column link set not null,
  alter column dedupe_key set not null;

alter table if exists public.notifications
  drop constraint if exists notifications_title_not_blank,
  drop constraint if exists notifications_message_not_blank,
  drop constraint if exists notifications_link_internal,
  drop constraint if exists notifications_dedupe_key_not_blank;

alter table if exists public.notifications
  add constraint notifications_title_not_blank
    check (btrim(title) <> ''),
  add constraint notifications_message_not_blank
    check (btrim(message) <> ''),
  add constraint notifications_link_internal
    check (
      btrim(link) <> ''
      and left(link, 1) = '/'
      and left(link, 2) <> '//'
      and strpos(link, E'\\') = 0
    ),
  add constraint notifications_dedupe_key_not_blank
    check (btrim(dedupe_key) <> '');

create unique index if not exists notifications_user_dedupe_key_unique
  on public.notifications (user_id, dedupe_key);
