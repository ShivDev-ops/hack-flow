// app/dashboard/triage/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function togglePaymentVerificationAction(participantId: string, currentStatus: boolean) {
  const supabase = await createClient();

  // "Bitter Truth": For B.Tech projects, this is fine. 
  // In a real startup, payment verification should be immutable (only set, not toggled) 
  // and require a justification log.
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