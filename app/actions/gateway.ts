// app/actions/gateway.ts
'use server'

import { createClient } from "@/lib/supabase/server";

export async function verifyPinAndFetchTeams(pin: string) {
  const supabase = await createClient();

  // 1. Find the active event with this PIN
  const { data: event, error } = await supabase
    .from('hf_events')
    .select('id')
    .eq('event_pin', pin)
    .eq('is_active', true)
    .single();

  if (error || !event) return { success: false, error: "Access Denied: Invalid PIN" };

  // 2. Fetch all unique team names for this event
  const { data: participants, error: pError } = await supabase
    .from('hf_participants')
    .select('team_name')
    .eq('event_id', event.id);

  if (pError) return { success: false, error: "System Error: Registry Offline" };

  // 3. Extract unique names
  const uniqueTeams = Array.from(new Set(participants.map(p => p.team_name)));

  return { success: true, teams: uniqueTeams, eventId: event.id };
}