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

  // 3. TELEMETRY: Manually log the action for the Terminal Audit Pulse
  const { data: task } = await supabase.from("hf_tasks").select("team_id").eq("id", taskId).single();
  if (task) {
    await supabase.from("hf_telemetry_logs").insert({
      team_id: task.team_id,
      action_type: "UPDATE",
      table_name: "hf_tasks",
      details: `Moved objective to ${newStatus}`
    });
  }

  revalidatePath("/lab/dashboard/terminal");
  return { success: true };
}

export async function deleteTaskAction(taskId: string, eventId: string) {
  const supabase = await createClient();

  // Deadline check (optional for delete, but let's keep it consistent)
  const { data: event } = await supabase
    .from("hf_events")
    .select("end_time")
    .eq("id", eventId)
    .single();

  if (event && new Date() > new Date(event.end_time)) {
    return { success: false, error: "EVENT_TERMINATED: Modifications are locked." };
  }

  // Get team_id for telemetry before deleting
  const { data: task } = await supabase.from("hf_tasks").select("team_id, title").eq("id", taskId).single();

  const { error } = await supabase
    .from("hf_tasks")
    .delete()
    .eq("id", taskId);

  if (error) return { success: false, error: error.message };

  // TELEMETRY
  if (task) {
    await supabase.from("hf_telemetry_logs").insert({
      team_id: task.team_id,
      action_type: "DELETE",
      table_name: "hf_tasks",
      details: `Deleted objective: ${task.title}`
    });
  }

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

  // TELEMETRY
  await supabase.from("hf_telemetry_logs").insert({
    team_id: teamId,
    action_type: "INSERT",
    table_name: "hf_tasks",
    details: `Created new objective: ${title}`
  });

  revalidatePath("/lab/dashboard/terminal");
  return { success: true };
  }