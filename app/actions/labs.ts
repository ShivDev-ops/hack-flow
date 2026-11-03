"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Participant } from "@/types/common";
import crypto from "crypto";

export async function promoteTeamToLab(teamName: string, eventId: string, participants: Participant[]) {
  const supabase = await createAdminClient();

  try {
    const participantIds = participants.map(p => p.id);

    // Prevent duplicate team creation / double clicks
    const { data: alreadyClaimed } = await supabase
      .from("hf_participants")
      .select("id, full_name, is_claimed")
      .in("id", participantIds)
      .eq("is_claimed", true);

    if (alreadyClaimed && alreadyClaimed.length > 0) {
      throw new Error(`Participants already assigned to a team: ${alreadyClaimed.map(p => p.full_name).join(", ")}`);
    }

    // Ensure unique readable_id with collision retry loop
    let readableId = "";
    let isUnique = false;
    for (let attempts = 0; attempts < 10; attempts++) {
      readableId = crypto.randomInt(100000, 999999).toString();
      const { data: existingTeam } = await supabase
        .from("hf_teams")
        .select("id")
        .eq("readable_id", readableId)
        .maybeSingle();

      if (!existingTeam) {
        isUnique = true;
        break;
      }
    }
    if (!isUnique) throw new Error("Failed to generate a unique Team ID. Please try again.");

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

    if (teamError || !team) throw new Error(teamError?.message || "Failed to create team record");

    const membersToInsert = participants.map(p => {
      const rawRole = p.role ? String(p.role).trim().toUpperCase() : "";
      const exactRole = (rawRole === 'LEADER' || rawRole === 'LEAD') ? 'LEAD' : 'MEMBER';

      return {
        team_id: team.id,
        participant_id: p.id,
        name: p.full_name,
        user_id: null, 
        role: exactRole,
        hashed_pin: hashedPin
      };
    });

    const { error: memberError } = await supabase
      .from("hf_team_members")
      .insert(membersToInsert);

    if (memberError) throw new Error(memberError.message);

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
