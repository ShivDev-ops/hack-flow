// app/dashboard/triage/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";



// Add this import at the top if you don't have it
import bcrypt from "bcryptjs";

export async function launchTeamAction(eventId: string, teamName: string, participantIds: string[]) {
  const supabase = await createClient();

  try {
    // 1. Generate the Team ID and the 4-digit PIN
    const readableId = `TEAM-${Math.floor(1000 + Math.random() * 9000)}`;
    const rawPin = Math.floor(1000 + Math.random() * 9000).toString();
    const hashedPin = await bcrypt.hash(rawPin, 10);

    // 2. CRITICAL FIX: Insert the Team WITH the event_id
    const { data: team, error: teamError } = await supabase
      .from("hf_teams")
      .insert({
        name: teamName,
        readable_id: readableId,
        event_id: eventId // <--- This links the team to the Lobby Timer!
      })
      .select("id")
      .single();

    if (teamError || !team) throw new Error("Failed to create team registry: " + teamError?.message);

    // 3. Fetch the selected participants from the staging table
    const { data: participants } = await supabase
      .from("hf_participants")
      .select("*")
      .in("id", participantIds);

    if (!participants || participants.length === 0) throw new Error("No participants found.");

    // 4. Map them to the final hf_team_members table
    const membersToInsert = participants.map(p => ({
      team_id: team.id,
      user_id: null, // Null until they link GitHub/Auth later
      role: p.role || "member",
      hashed_pin: hashedPin
    }));

    const { error: memberError } = await supabase
      .from("hf_team_members")
      .insert(membersToInsert);

    if (memberError) throw new Error("Failed to insert members: " + memberError.message);

    // 5. Mark them as "Claimed" in the staging table so they disappear from Triage
    await supabase
      .from("hf_participants")
      .update({ is_claimed: true })
      .in("id", participantIds);

    revalidatePath("/dashboard/triage");

    // Return the raw PIN to the frontend so the Admin can give it to the team
    return { success: true, teamId: readableId, pin: rawPin };

  } catch (error: any) {
    console.error("LAUNCH_ERROR:", error.message);
    return { success: false, error: error.message };
  }
}

export async function togglePaymentVerificationAction(participantId: string, currentStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hf_participants")
    .update({ payment_verified: !currentStatus })
    .eq("id", participantId);

  if (error) {
    console.error("PAYMENT_UPDATE_ERROR:", error.message);
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/triage");
  return { success: true };
}

export async function toggleClaimStatus(participantId: string, currentStatus: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("hf_participants")
    .update({ is_claimed: !currentStatus })
    .eq("id", participantId);

  if (error) return { success: false, message: error.message };

  revalidatePath("/dashboard/triage");
  return { success: true };
}