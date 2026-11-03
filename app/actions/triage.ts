// app/dashboard/triage/actions.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import bcrypt from "bcryptjs";

export async function launchTeamAction(eventId: string, teamName: string, participantIds: string[]) {
  const supabase = await createAdminClient();

  try {
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

    if (teamError || !team) throw new Error("Failed to create team registry: " + (teamError?.message || ""));

    const { data: participants } = await supabase
      .from("hf_participants")
      .select("*")
      .in("id", participantIds);

    if (!participants || participants.length === 0) throw new Error("No participants found.");

    // 4. Map them with correct roles and names
    const membersToInsert = participants.map(p => {
      // Normalize role: only allow ONE lead per team during this map 
      // (or respect what's in the DB if it's already sanitized)
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

    if (memberError) throw new Error("Failed to insert members: " + memberError.message);

    await supabase
      .from("hf_participants")
      .update({ is_claimed: true })
      .in("id", participantIds);

    revalidatePath("/dashboard/triage");
    return { success: true, teamId: readableId, pin: rawPin };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("LAUNCH_ERROR:", message);
    return { success: false, error: message };
  }
}

export async function togglePaymentVerificationAction(participantId: string, currentStatus: boolean) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("hf_participants")
    .update({ payment_verified: !currentStatus })
    .eq("id", participantId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/triage");
  return { success: true };
}

export async function toggleClaimStatus(participantId: string, currentStatus: boolean) {
  const supabase = await createAdminClient();
  const { error } = await supabase
    .from("hf_participants")
    .update({ is_claimed: !currentStatus })
    .eq("id", participantId);
  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/triage");
  return { success: true };
}
