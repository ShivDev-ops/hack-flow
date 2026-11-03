"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function verifyPinAndFetchTeams(pin: string) {
  const supabase = await createAdminClient();

  // 1. Find the active event with this PIN
  const { data: event, error } = await supabase
    .from('hf_events')
    .select('id, name')
    .eq('event_pin', pin.trim())
    .eq('is_active', true)
    .single();

  if (error || !event) return { success: false, error: "Access Denied: Invalid Event PIN." };

  // 2. Fetch all unique team names for this event
  const { data: participants, error: pError } = await supabase
    .from('hf_participants')
    .select('team_name')
    .eq('event_id', event.id);

  if (pError) return { success: false, error: "System Error: Registry Offline." };

  // 3. Extract unique non-null names
  const uniqueTeams = Array.from(new Set(participants.map(p => p.team_name).filter(Boolean)));

  return { success: true, teams: uniqueTeams, eventId: event.id, eventName: event.name };
}

export async function fetchTeamMembersForGateway(eventId: string, teamName: string) {
  const supabase = await createAdminClient();

  // Check if team is registered in hf_teams
  const { data: team } = await supabase
    .from('hf_teams')
    .select('id, readable_id')
    .eq('event_id', eventId)
    .ilike('name', teamName.trim())
    .maybeSingle();

  // Get participants from hf_participants for this team
  const { data: participants, error } = await supabase
    .from('hf_participants')
    .select('id, full_name, role, email')
    .eq('event_id', eventId)
    .ilike('team_name', teamName.trim());

  if (error || !participants || participants.length === 0) {
    return { success: false, error: "No team members found for this team." };
  }

  return {
    success: true,
    isPromoted: !!team,
    readableId: team?.readable_id || null,
    participants: participants.map(p => ({
      id: p.id,
      name: p.full_name,
      role: p.role || 'MEMBER'
    }))
  };
}