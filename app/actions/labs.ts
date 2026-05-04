"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function promoteTeamToLab(teamName: string, eventId: string, participants: any[]) {
  const supabase = await createClient();

  // 1. Generate unique Team ID & 4-digit PIN
  const teamId = `TEAM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const rawPin = Math.floor(1000 + Math.random() * 9000).toString();
  const hashedPin = await bcrypt.hash(rawPin, 10);

  // 2. Create the Official Team Record
  const { data: team, error: teamError } = await supabase
    .from("hf_teams")
    .insert({ 
      name: teamName, 
      event_id: eventId,
      readable_id: teamId // Store the unique ID here
    })
    .select()
    .single();

  if (teamError) return { success: false, error: teamError.message };

  // 3. Create Team Members (All share the same Team PIN)
  const memberRecords = participants.map((p) => ({
    team_id: team.id,
    user_id: p.claimed_by_id || null, // Link to university account if claimed
    role: p.role === 'leader' ? 'LEAD' : 'MEMBER',
    hashed_pin: hashedPin,
    is_verified: true
  }));

  const { error: memberError } = await supabase.from("hf_team_members").insert(memberRecords);
  
  if (memberError) return { success: false, error: memberError.message };

  // 4. Cleanup Staging Data
  await supabase.from("hf_participants").delete().eq("team_name", teamName).eq("event_id", eventId);

  revalidatePath("/dashboard/triage");
  
  // Return both the ID and the PIN to the Organizer UI
  return { 
    success: true, 
    teamId: teamId,
    pin: rawPin 
  };
}