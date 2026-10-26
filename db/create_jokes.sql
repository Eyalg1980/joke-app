-- Milestone 5: migration create_jokes
-- טבלה אחת לבדיחות ה-AI ולצחוקים. נעולה לכל תפקיד חוץ מ-service_role.

create table public.jokes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  topic text,
  text text not null,
  laughs integer not null default 0
);

alter table public.jokes enable row level security;

revoke all on table public.jokes from anon, authenticated;
grant select, insert, update on table public.jokes to service_role;

-- עדכון אחד, כדי ששני צחוקים באותו רגע לא ידרסו זה את זה.
-- מחזירה את המספר החדש, או null אם אין בדיחה עם ה-id הזה.
create function public.add_laugh(joke_id uuid)
returns integer
language sql
security invoker
set search_path = ''
as $$
  update public.jokes
  set laughs = laughs + 1
  where id = joke_id
  returning laughs;
$$;

revoke execute on function public.add_laugh(uuid) from public, anon, authenticated;
grant execute on function public.add_laugh(uuid) to service_role;
