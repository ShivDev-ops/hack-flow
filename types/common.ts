export interface Event {
  id: string;
  name: string;
  max_members: number;
  start_time: string;
  end_time: string | null;
  is_active: boolean;
  column_mapping: Record<string, string>;
  created_at: string;
}

export interface Participant {
  id: string;
  event_id: string;
  full_name: string;
  registration_no: string;
  email: string | null;
  phone_number: string | null;
  team_name: string;
  is_claimed: boolean;
  payment_verified: boolean;
  payment_id: string | null;
  payment_url: string | null;
  role: 'leader' | 'member';
  created_at: string;
}

export interface Task {
  id: string;
  team_id: string;
  event_id: string;
  title: string;
  description: string;
  status: 'Todo' | 'Progress' | 'Review' | 'Verified';
  commit_sha: string | null;
  created_at: string;
}

export interface Commit {
  id: string;
  team_id: string;
  commit_sha: string;
  message: string;
  author_handle: string;
  created_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  readable_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string | null;
  role: 'LEAD' | 'MEMBER';
  is_verified: boolean;
  created_at: string;
}
