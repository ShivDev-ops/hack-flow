// app/actions/link-recovery.ts
"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Recovers the linked event ID for the current organizer
 * Bypass RLS to ensure dashboard linkage is always accurate.
 */
export async function recoverEventLinkAction() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.role !== "ORGANIZER") {
    return { success: false, eventId: null };
  }

  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("hf_organizer_credentials")
    .select("event_id")
    .eq("id", session.user.id)
    .single();

  if (error || !data) {
    return { success: false, eventId: null };
  }

  return { success: true, eventId: data.event_id };
}
