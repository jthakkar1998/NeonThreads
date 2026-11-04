-- NEON THREADS | V2 - delete group (SAFE FOR EXISTING PROJECTS)
-- Run this migration in Supabase SQL Editor on the existing Neon Threads project.
-- Do NOT rerun the initial migration or delete tables to add this feature.
-- Keeps auth.users and profiles unchanged; the group and its related rows are removed.

create or replace function public.delete_group(p_group_id uuid, p_confirmation text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_group public.groups%rowtype;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Please log in first.';
  end if;

  -- Lock the group to serialize against draws, joins, resets, and group edits.
  select * into v_group
    from public.groups
    where id = p_group_id
    for update;

  if not found or v_group.organizer_id <> v_user then
    raise exception 'Only the organizer can delete this group.';
  end if;

  -- Revalidate confirmation in the database; frontend text matching is not security.
  if p_confirmation is distinct from v_group.name then
    raise exception 'Group name did not match. Deletion cancelled.';
  end if;

  -- Explicit delete first to avoid FK ordering issues with group_members.
  -- Removing groups cascades to group_members. User accounts remain intact.
  delete from public.assignments where group_id = p_group_id;
  delete from public.groups where id = p_group_id;
end;
$$;

-- Functions default to public EXECUTE unless explicitly revoked.
revoke all on function public.delete_group(uuid, text) from public, anon, authenticated;
grant execute on function public.delete_group(uuid, text) to authenticated;

-- Make the new RPC visible promptly to the Supabase/PostgREST API.
notify pgrst, 'reload schema';
