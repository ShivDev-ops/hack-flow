"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(
  taskId: string, 
  newStatus: string, 
  eventId: string, 
  commitSha: string | null = null,
  reason: string | null = null
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
  const { data: task } = await supabase.from("hf_tasks").select("team_id, title").eq("id", taskId).single();
  if (task) {
    const logDetail = reason 
      ? `Task "${task.title}" -> ${newStatus} | Reason: ${reason}`
      : `Moved objective to ${newStatus}`;

    await supabase.from("hf_telemetry_logs").insert({
      team_id: task.team_id,
      action_type: "UPDATE",
      table_name: "hf_tasks",
      details: logDetail
    });
  }

  revalidatePath("/lab/dashboard/terminal");
  return { success: true };
}

export async function deleteTaskAction(taskId: string, eventId: string) {
    const supabase = await createClient();

    // Deadline check
    const { data: event } = await supabase
        .from("hf_events")
        .select("end_time")
        .eq("id", eventId)
        .single();

    if (event && new Date() > new Date(event.end_time)) {
        return { success: false, error: "EVENT_TERMINATED: Mission data is locked." };
    }

    const { error } = await supabase
        .from("hf_tasks")
        .delete()
        .eq("id", taskId);

    if (error) return { success: false, error: error.message };

    revalidatePath("/lab/dashboard/terminal");
    return { success: true };
}

export async function createTaskAction(teamId: string, eventId: string, title: string, description: string) {
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

export async function bulkAddTasksAction(teamId: string, eventId: string, tasks: { title: string, description: string, phase: number }[]) {
  const supabase = await createClient();

  let finalEventId = eventId;
  if (!finalEventId) {
    const { data: team } = await supabase.from("hf_teams").select("event_id").eq("id", teamId).single();
    if (team) finalEventId = team.event_id;
  }

  const taskData = tasks.map(t => ({
    team_id: teamId,
    event_id: finalEventId,
    title: `[PHASE ${t.phase}] ${t.title}`,
    description: t.description,
    status: 'Todo'
  }));

  const { error } = await supabase
    .from("hf_tasks")
    .insert(taskData);

  if (error) return { success: false, error: error.message };

  await supabase.from("hf_telemetry_logs").insert({
    team_id: teamId,
    action_type: "INSERT",
    table_name: "hf_tasks",
    details: `User approved and added ${tasks.length} AI-suggested objectives.`
  });

  revalidatePath("/lab/dashboard/terminal");
  revalidatePath("/lab/dashboard/kanban");
  return { success: true };
}

export async function linkCommitToTaskAction(teamId: string, taskId: string, commitSha: string) {
    const supabase = await createClient();
  
    const { error } = await supabase
      .from("hf_tasks")
      .update({ 
          status: 'Review',
          commit_sha: commitSha 
      })
      .eq("id", taskId)
      .eq("team_id", teamId);
  
    if (error) return { success: false, error: error.message };
  
    await supabase.from("hf_telemetry_logs").insert({
      team_id: teamId,
      action_type: "UPDATE",
      table_name: "hf_tasks",
      details: `User approved Neural Link: Commit ${commitSha.substring(0,7)} linked to task.`
    });
  
    revalidatePath("/lab/dashboard/terminal");
    revalidatePath("/lab/dashboard/kanban");
    return { success: true };
}
