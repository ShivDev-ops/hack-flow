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
  status: 'Todo' | 'Progress' | 'Review' | 'Verified' | 'Bugs';
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
  repo_url?: string;
  deployment_url?: string;
  ai_progress_score?: number;
  ai_status_summary?: string;
  showcase_audit?: boolean;
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

export interface DNAMilestone {
  id: string;
  team_id: string;
  milestone_title: string;
  milestone_description: string;
  verification_criteria: string;
  weight: number;
  status: 'pending' | 'in_progress' | 'complete';
  created_at: string;
}

export interface JudgingResult {
  id: string;
  team_id: string;
  event_id: string;
  alignment_score: number;
  execution_score: number;
  innovation_score: number;
  technical_score: number;
  total_score: number;
  ai_justification: string;
  created_at: string;
}
