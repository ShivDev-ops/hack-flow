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

  // 1. DEADLINE CHECK
  const { data: event } = await supabase
    .from("hf_events")
    .select("end_time")
    .eq("id", eventId)
    .single();

  if (event && new Date() > new Date(event.end_time)) {
    return { success: false, error: "EVENT_TERMINATED: Deadline has passed." };
  }

  const updateData: Record<string, string | null> = { status: newStatus };
  if (commitSha) updateData.commit_sha = commitSha;

  const { error } = await supabase
    .from("hf_tasks")
    .update(updateData)
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/lab/dashboard/terminal");
  return { success: true };
}

export async function createTaskAction(
  teamId: string,
  eventId: string,
  title: string,
  description: string
) {
  const supabase = await createClient();

  // Deadline check
  const { data: event } = await supabase
    .from("hf_events")
    .select("end_time")
    .eq("id", eventId)
    .single();

  if (event && new Date() > new Date(event.end_time)) {
    return { success: false, error: "EVENT_TERMINATED: Backlog is locked." };
  }

  const { error } = await supabase
    .from("hf_tasks")
    .insert({
      team_id: teamId,
      event_id: eventId,
      title,
      description,
      status: "Todo"
    });

  if (error) return { success: false, error: error.message };
  revalidatePath("/lab/dashboard/terminal");
  return { success: true };
}