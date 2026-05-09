"use server";

import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { Participant } from "@/types/common";

import crypto from "crypto";

export async function promoteTeamToLab(teamName: string, eventId: string, participants: Participant[]) {
  const supabase = await createClient();

  try {
    const readableId = crypto.randomInt(100000, 999999).toString();
    const rawPin = crypto.randomInt(100000, 999999).toString();
    const hashedPin = await bcrypt.hash(rawPin, 10);

    const { data: team, error: teamError } = await supabase
      .from("hf_teams")
      .insert({
        name: teamName,
        readable_id: readableId,
        event_id: eventId 
      })
      .select("id")
      .single();

    if (teamError || !team) throw new Error(teamError.message);

    const membersToInsert = participants.map(p => {
      const rawRole = p.role ? String(p.role).trim().toUpperCase() : "";
      const exactRole = (rawRole === 'LEADER' || rawRole === 'LEAD') ? 'LEAD' : 'MEMBER';

      return {
        team_id: team.id,
        user_id: null, 
        role: exactRole,
        hashed_pin: hashedPin
      };
    });

    const { error: memberError } = await supabase
      .from("hf_team_members")
      .insert(membersToInsert);

    if (memberError) throw new Error(memberError.message);

    const participantIds = participants.map(p => p.id);
    const { error: updateError } = await supabase
      .from("hf_participants")
      .update({ is_claimed: true })
      .in("id", participantIds);

    if (updateError) throw new Error("Participant Update Failed: " + updateError.message);

    revalidatePath("/dashboard/triage");

    return { success: true, teamId: readableId, pin: rawPin };
    
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}