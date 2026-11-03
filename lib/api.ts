'use client';

import { supabase } from '@/lib/supabase';
import type { Assignment, GroupDashboard, GroupInput, GroupSummary, InvitePreview, ShirtSize } from '@/lib/types';

async function call<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase().rpc(name, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const api = {
  myGroups: () => call<GroupSummary[]>('get_my_groups'),
  dashboard: (groupId: string) => call<GroupDashboard>('get_group_dashboard', { p_group_id: groupId }),
  previewInvite: (invite: string) => call<InvitePreview>('preview_invite', { p_invite_code: invite }),
  joinGroup: (invite: string) => call<string>('join_group', { p_invite_code: invite }),
  createGroup: (input: GroupInput) => call<string>('create_group', {
    p_name: input.name, p_concert_name: input.concert_name, p_concert_date: input.concert_date,
    p_venue: input.venue, p_expected_members: input.expected_members,
  }),
  updateGroup: (groupId: string, input: GroupInput) => call<void>('update_group', {
    p_group_id: groupId, p_name: input.name, p_concert_name: input.concert_name,
    p_concert_date: input.concert_date, p_venue: input.venue, p_expected_members: input.expected_members,
  }),
  setSize: (groupId: string, size: ShirtSize) => call<void>('set_my_size', { p_group_id: groupId, p_size: size }),
  generateDraw: (groupId: string) => call<void>('generate_draw', { p_group_id: groupId }),
  resetDraw: (groupId: string) => call<void>('reset_draw', { p_group_id: groupId }),
  removeMember: (groupId: string, userId: string) => call<void>('remove_member', { p_group_id: groupId, p_user_id: userId }),
  assignment: (groupId: string) => call<Assignment | null>('get_my_assignment', { p_group_id: groupId }),
  myProfile: () => call<{ display_name: string; email: string }>('get_my_profile'),
  updateProfile: (name: string) => call<void>('update_my_profile', { p_display_name: name }),
};
