"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(
  taskId: string, 
  newStatus: string, 
  eventId: string, 
  commitSha: string | null = null
) {
  const supabase = await createClient();

  // 1. DEADLINE CHECK (The "Hard Lock")
  // Prevents any task movement if the hackathon timer has expired.
  const { data: event } = await supabase
    .from("hf_events")
    .select("end_time")
    .eq("id", eventId)
    .single();

  if (event && new Date() > new Date(event.end_time)) {
    return { 
      success: false, 
      error: "EVENT_TERMINATED: Deadline has passed. Write-access is locked." 
    };
  }

  // 2. PREPARE UPDATE PAYLOAD
  const updateData: Record<string, string | null> = { 
    status: newStatus 
  };

  // 3. ATTACH GIT SIGNATURE (If task is moving to Review)
  if (commitSha) {
    updateData.commit_sha = commitSha;
  }

  // 4. EXECUTE DATABASE UPDATE
  const { error } = await supabase
    .from("hf_tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) {
    return { success: false, error: error.message };
  }

  // 5. PURGE CACHE FOR LIVE SYNC
  revalidatePath("/lab/dashboard/terminal");
  return { success: true };
}