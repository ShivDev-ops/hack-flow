"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTeamConfig(teamId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hf_teams")
    .select("repo_url")
    .eq("id", teamId)
    .single();
    
  if (error) return { success: false, error: error.message };
  return { success: true, config: data };
}

export async function updateTeamConfig(teamId: string, repoUrl: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hf_teams")
    .update({ repo_url: repoUrl })
    .eq("id", teamId);
    
  if (error) return { success: false, error: error.message };
  
  revalidatePath("/lab/dashboard/terminal");
  revalidatePath("/lab/config");
  return { success: true };
}

export async function verifyTeamSync(teamId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("repository_commits")
    .select("*", { count: 'exact', head: true })
    .eq("team_id", teamId);
    
  if (error) return { success: false, error: error.message };
  return { success: true, count: count || 0 };
}
