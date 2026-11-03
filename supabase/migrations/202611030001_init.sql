-- NEON THREADS | Initial schema and security functions
-- Run ONCE in Supabase SQL Editor (or via supabase db push).
-- All sensitive operations run in the database. No service-role key is used by the app.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 60),
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  concert_name text not null check (char_length(btrim(concert_name)) between 2 and 100),
  concert_date date not null,
  venue text,
  expected_members integer not null check (expected_members between 3 and 200),
  organizer_id uuid not null references auth.users(id),
  invite_code uuid not null default gen_random_uuid() unique,
  draw_version integer not null default 0,
  drawn_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  shirt_size text check (shirt_size in ('XS','S','M','L','XL','2XL','3XL','4XL','5XL')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.assignments (
  group_id uuid not null references public.groups(id) on delete cascade,
  giver_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  draw_version integer not null,
  created_at timestamptz not null default now(),
  primary key (group_id, giver_id),
  unique (group_id, recipient_id),
  check (giver_id <> recipient_id),
  foreign key (group_id, giver_id) references public.group_members(group_id, user_id),
  foreign key (group_id, recipient_id) references public.group_members(group_id, user_id)
);

create index if not exists group_members_user_idx on public.group_members(user_id);
create index if not exists groups_organizer_idx on public.groups(organizer_id);

-- Account profile is created automatically upon auth.users signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (
    new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
        split_part(coalesce(new.email, 'raver'), '@', 1)), 60)
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill if this app is enabled in a Supabase project with pre-existing accounts.
insert into public.profiles (id, display_name)
select id, left(coalesce(nullif(btrim(raw_user_meta_data ->> 'display_name'), ''),
       split_part(coalesce(email, 'raver'), '@', 1)), 60)
from auth.users
on conflict (id) do nothing;

-- Deny direct access to all private tables by default.
alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.assignments enable row level security;

revoke all on public.profiles, public.groups, public.group_members, public.assignments
  from public, anon, authenticated;
-- Belt and suspenders: if a direct SELECT is ever allowed, it can only return
-- the authenticated user's own giver row. All current app reads use RPC.
create policy assignment_owner_only on public.assignments
for select to authenticated using (giver_id = (select auth.uid()));

create or replace function public.get_my_profile()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Please log in first.'; end if;
  return (
    select jsonb_build_object('display_name', p.display_name, 'email', u.email)
    from public.profiles p join auth.users u on u.id = p.id where p.id = v_user
  );
end;
$$;

create or replace function public.update_my_profile(p_display_name text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  if p_display_name is null or char_length(btrim(p_display_name)) not between 1 and 60
  then raise exception 'Please enter a name between 1 and 60 characters.'; end if;
  update public.profiles set display_name = btrim(p_display_name) where id = auth.uid();
end;
$$;

create or replace function public.create_group(
  p_name text, p_concert_name text, p_concert_date date,
  p_venue text, p_expected_members integer
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_group_id uuid; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Please log in first.'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 80
     or p_concert_name is null or char_length(btrim(p_concert_name)) not between 2 and 100
     or p_concert_date is null or p_expected_members is null or p_expected_members not between 3 and 200
  then raise exception 'Enter a group name, concert, date and a group size between 3 and 200.'; end if;
  if p_venue is not null and char_length(p_venue) > 120
  then raise exception 'Venue must be at most 120 characters.'; end if;
  insert into public.groups(name, concert_name, concert_date, venue, expected_members, organizer_id)
  values (btrim(p_name), btrim(p_concert_name), p_concert_date, nullif(btrim(p_venue), ''), p_expected_members, v_user)
  returning id into v_group_id;
  insert into public.group_members(group_id, user_id) values (v_group_id, v_user);
  return v_group_id;
end;
$$;

-- Public-facing invite preview. The unguessable UUID invite code acts as access to preview metadata only.
create or replace function public.preview_invite(p_invite_code uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'name', g.name,
    'concert_name', g.concert_name,
    'concert_date', g.concert_date,
    'expected_members', g.expected_members,
    'joined_count', (select count(*) from public.group_members m where m.group_id = g.id),
    'drawn', g.drawn_at is not null
  )
  from public.groups g where g.invite_code = p_invite_code;
$$;

create or replace function public.join_group(p_invite_code uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_group public.groups%rowtype; v_count integer; v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Please log in first.'; end if;
  select * into v_group from public.groups where invite_code = p_invite_code for update;
  if not found then raise exception 'This invitation link is invalid.'; end if;
  if exists (select 1 from public.group_members where group_id = v_group.id and user_id = v_user)
  then return v_group.id; end if;
  if v_group.drawn_at is not null then raise exception 'This exchange is locked. The draw has already happened.'; end if;
  select count(*) into v_count from public.group_members where group_id = v_group.id;
  if v_count >= v_group.expected_members then raise exception 'This group is full. Ask the organizer to increase the group size.'; end if;
  insert into public.group_members(group_id, user_id) values (v_group.id, v_user);
  return v_group.id;
end;
$$;

create or replace function public.get_my_groups()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', g.id, 'name', g.name, 'concert_name', g.concert_name,
      'concert_date', g.concert_date, 'venue', g.venue,
      'expected_members', g.expected_members, 'joined_count', s.joined_count,
      'sizes_ready', s.sizes_ready, 'drawn_at', g.drawn_at,
      'is_organizer', g.organizer_id = auth.uid()
    ) order by g.created_at desc
  ), '[]'::jsonb)
  from public.groups g
  join public.group_members own on own.group_id = g.id and own.user_id = auth.uid()
  cross join lateral (
    select count(*)::integer as joined_count,
           count(*) filter (where m.shirt_size is not null)::integer as sizes_ready
    from public.group_members m where m.group_id = g.id
  ) s;
$$;

create or replace function public.get_group_dashboard(p_group_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_result jsonb;
begin
  if v_user is null or not exists (
    select 1 from public.group_members where group_id = p_group_id and user_id = v_user
  ) then raise exception 'You are not a member of this group.'; end if;

  select jsonb_build_object(
    'id', g.id, 'name', g.name, 'concert_name', g.concert_name,
    'concert_date', g.concert_date, 'venue', g.venue,
    'expected_members', g.expected_members,
    'joined_count', (select count(*) from public.group_members m where m.group_id = g.id),
    'sizes_ready', (select count(*) from public.group_members m where m.group_id = g.id and m.shirt_size is not null),
    'drawn_at', g.drawn_at,
    'is_organizer', (g.organizer_id = v_user),
    'invite_code', case when g.organizer_id = v_user then to_jsonb(g.invite_code) else null end,
    'my_size', (select m.shirt_size from public.group_members m where m.group_id = g.id and m.user_id = v_user),
    'members', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'user_id', m.user_id, 'display_name', p.display_name,
          'size_submitted', m.shirt_size is not null,
          'is_organizer', m.user_id = g.organizer_id,
          'is_me', m.user_id = v_user,
          'joined_at', m.joined_at
        ) order by m.joined_at, p.display_name
      ), '[]'::jsonb)
      from public.group_members m join public.profiles p on p.id = m.user_id
      where m.group_id = g.id
    )
  ) into v_result from public.groups g where g.id = p_group_id;
  return v_result;
end;
$$;

create or replace function public.set_my_size(p_group_id uuid, p_size text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  if p_size is null or p_size not in ('XS','S','M','L','XL','2XL','3XL','4XL','5XL')
  then raise exception 'Please select a valid shirt size.'; end if;
  update public.group_members set shirt_size = p_size
  where group_id = p_group_id and user_id = auth.uid();
  if not found then raise exception 'You are not a member of this group.'; end if;
end;
$$;

create or replace function public.update_group(
  p_group_id uuid, p_name text, p_concert_name text, p_concert_date date,
  p_venue text, p_expected_members integer
)
returns void language plpgsql security definer set search_path = '' as $$
declare v_group public.groups%rowtype; v_count integer;
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  select * into v_group from public.groups where id = p_group_id for update;
  if not found or v_group.organizer_id <> auth.uid() then raise exception 'Only the organizer can edit this group.'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 2 and 80
     or p_concert_name is null or char_length(btrim(p_concert_name)) not between 2 and 100
     or p_concert_date is null or p_expected_members is null or p_expected_members not between 3 and 200
  then raise exception 'Enter a group name, concert, date and a group size between 3 and 200.'; end if;
  if p_venue is not null and char_length(p_venue) > 120
  then raise exception 'Venue must be at most 120 characters.'; end if;
  select count(*) into v_count from public.group_members where group_id = p_group_id;
  if p_expected_members < v_count then raise exception 'Group size cannot be below the current registered member count.'; end if;
  if v_group.drawn_at is not null and p_expected_members <> v_group.expected_members
  then raise exception 'Reset assignments before changing the expected group size.'; end if;
  update public.groups set
    name = btrim(p_name), concert_name = btrim(p_concert_name), concert_date = p_concert_date,
    venue = nullif(btrim(p_venue), ''), expected_members = p_expected_members
  where id = p_group_id;
end;
$$;

create or replace function public.remove_member(p_group_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_group public.groups%rowtype;
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  select * into v_group from public.groups where id = p_group_id for update;
  if not found or v_group.organizer_id <> auth.uid() then raise exception 'Only the organizer can remove members.'; end if;
  if v_group.drawn_at is not null then raise exception 'Reset assignments before removing a member.'; end if;
  if p_user_id = v_group.organizer_id then raise exception 'The organizer cannot remove themselves.'; end if;
  delete from public.group_members where group_id = p_group_id and user_id = p_user_id;
  if not found then raise exception 'This member is not in the group.'; end if;
end;
$$;

-- A uniformly randomized circular permutation: every member gives exactly one
-- shirt, receives exactly one, nobody gets themselves, and reciprocal pairs
-- are mathematically impossible for group sizes >= 3.
-- Inserting all rows in a single DB transaction prevents partial draws.
create or replace function public.generate_draw(p_group_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_group public.groups%rowtype;
  v_members uuid[];
  v_count integer;
  v_ready integer;
  v_idx integer;
  v_recipient uuid;
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  select * into v_group from public.groups where id = p_group_id for update;
  if not found or v_group.organizer_id <> auth.uid() then raise exception 'Only the organizer can draw assignments.'; end if;
  if v_group.drawn_at is not null then raise exception 'Assignments have already been drawn. Reset to draw again.'; end if;
  if exists (select 1 from public.assignments where group_id = p_group_id)
  then raise exception 'Existing assignments found. Reset the draw before proceeding.'; end if;

  select array_agg(m.user_id order by gen_random_uuid()),
         count(*)::integer,
         count(*) filter (where m.shirt_size is not null)::integer
  into v_members, v_count, v_ready
  from public.group_members m where m.group_id = p_group_id;

  if v_count < 3 or v_count <> v_group.expected_members
  then raise exception 'All expected group members must register before drawing (minimum 3).'; end if;
  if v_ready <> v_count then raise exception 'Everyone must submit a T-shirt size before drawing.'; end if;

  for v_idx in 1..v_count loop
    v_recipient := v_members[case when v_idx = v_count then 1 else v_idx + 1 end];
    insert into public.assignments(group_id, giver_id, recipient_id, draw_version)
    values (p_group_id, v_members[v_idx], v_recipient, v_group.draw_version + 1);
  end loop;
  update public.groups set drawn_at = now(), draw_version = draw_version + 1 where id = p_group_id;
end;
$$;

create or replace function public.reset_draw(p_group_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_group public.groups%rowtype;
begin
  if auth.uid() is null then raise exception 'Please log in first.'; end if;
  select * into v_group from public.groups where id = p_group_id for update;
  if not found or v_group.organizer_id <> auth.uid() then raise exception 'Only the organizer can reset assignments.'; end if;
  if v_group.drawn_at is null then raise exception 'There is no completed draw to reset.'; end if;
  delete from public.assignments where group_id = p_group_id;
  update public.groups set drawn_at = null where id = p_group_id;
end;
$$;

create or replace function public.get_my_assignment(p_group_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null or not exists (
    select 1 from public.group_members where group_id = p_group_id and user_id = v_user
  ) then raise exception 'You are not a member of this group.'; end if;
  return (
    select jsonb_build_object(
      'recipient_name', p.display_name,
      'recipient_size', m.shirt_size,
      'draw_version', a.draw_version
    )
    from public.assignments a
    join public.group_members m on m.group_id = a.group_id and m.user_id = a.recipient_id
    join public.profiles p on p.id = a.recipient_id
    where a.group_id = p_group_id and a.giver_id = v_user
  );
end;
$$;

-- In PostgreSQL, functions default to EXECUTE for PUBLIC unless revoked.
-- Grant individual RPCs only to the roles that need them.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.get_my_profile() from public, anon, authenticated;
revoke all on function public.update_my_profile(text) from public, anon, authenticated;
revoke all on function public.create_group(text, text, date, text, integer) from public, anon, authenticated;
revoke all on function public.preview_invite(uuid) from public, anon, authenticated;
revoke all on function public.join_group(uuid) from public, anon, authenticated;
revoke all on function public.get_my_groups() from public, anon, authenticated;
revoke all on function public.get_group_dashboard(uuid) from public, anon, authenticated;
revoke all on function public.set_my_size(uuid, text) from public, anon, authenticated;
revoke all on function public.update_group(uuid, text, text, date, text, integer) from public, anon, authenticated;
revoke all on function public.remove_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.generate_draw(uuid) from public, anon, authenticated;
revoke all on function public.reset_draw(uuid) from public, anon, authenticated;
revoke all on function public.get_my_assignment(uuid) from public, anon, authenticated;

grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.update_my_profile(text) to authenticated;
grant execute on function public.create_group(text, text, date, text, integer) to authenticated;
grant execute on function public.preview_invite(uuid) to anon, authenticated;
grant execute on function public.join_group(uuid) to authenticated;
grant execute on function public.get_my_groups() to authenticated;
grant execute on function public.get_group_dashboard(uuid) to authenticated;
grant execute on function public.set_my_size(uuid, text) to authenticated;
grant execute on function public.update_group(uuid, text, text, date, text, integer) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.generate_draw(uuid) to authenticated;
grant execute on function public.reset_draw(uuid) to authenticated;
grant execute on function public.get_my_assignment(uuid) to authenticated;
