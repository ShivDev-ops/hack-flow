"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, newStatus: string, eventId: string) {
  const supabase = await createClient();

  // 1. DEADLINE CHECK (The "Hard Lock")
  const { data: event } = await supabase
    .from("hf_events")
    .select("end_time")
    .eq("id", eventId)
    .single();

  if (event && new Date() > new Date(event.end_time)) {
    return { success: false, error: "EVENT_TERMINATED: Deadline has passed. Write-access is locked." };
  }

  // 2. Perform Update
  const { error } = await supabase
    .from("hf_tasks")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/lab/terminal");
  return { success: true };
}