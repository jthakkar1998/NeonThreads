export type ShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL' | '5XL';
export const SHIRT_SIZES: ShirtSize[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];

export type GroupSummary = {
  id: string;
  name: string;
  concert_name: string;
  concert_date: string;
  venue: string | null;
  expected_members: number;
  joined_count: number;
  sizes_ready: number;
  drawn_at: string | null;
  is_organizer: boolean;
};

export type Member = {
  user_id: string;
  display_name: string;
  size_submitted: boolean;
  is_organizer: boolean;
  is_me: boolean;
  joined_at: string;
};

export type GroupDashboard = {
  id: string;
  name: string;
  concert_name: string;
  concert_date: string;
  venue: string | null;
  expected_members: number;
  joined_count: number;
  sizes_ready: number;
  drawn_at: string | null;
  is_organizer: boolean;
  invite_code: string | null;
  my_size: ShirtSize | null;
  members: Member[];
};

export type InvitePreview = {
  name: string;
  concert_name: string;
  concert_date: string;
  joined_count: number;
  expected_members: number;
  drawn: boolean;
};

export type Assignment = {
  recipient_name: string;
  recipient_size: ShirtSize | null;
  draw_version: number;
};

export type GroupInput = {
  name: string;
  concert_name: string;
  concert_date: string;
  venue: string;
  expected_members: number;
};
