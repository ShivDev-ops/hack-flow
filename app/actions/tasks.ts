"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLabTask(formData: {
  title: string;
  description: string;
  priority: string;
  teamId: string;
  eventId: string;
}) {
  const supabase = await createClient();

  // 1. Deadline Check
  const { data: event } = await supabase
    .from("hf_events")
    .select("end_time")
    .eq("id", formData.eventId)
    .single();

  if (event && new Date() > new Date(event.end_time)) {
    return { success: false, error: "CRITICAL: Mission duration exceeded. Local write-access disabled." };
  }

  // 2. Insert Task
  const { error } = await supabase.from("hf_tasks").insert({
    title: formData.title,
    description: formData.description,
    priority: formData.priority,
    team_id: formData.teamId,
    status: "Todo",
    created_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/lab/dashboard/terminal");
  return { success: true };
}