"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getTeamConfig(teamId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hf_teams")
    .select("repo_url, deployment_url, db_connection, readable_id")
    .eq("id", teamId)
    .single();
    
  if (error) return { success: false, error: error.message };
  return { success: true, config: data };
}

export async function updateTeamConfig(teamId: string, repoUrl: string, deploymentUrl?: string, dbConnection?: string) {
  const supabase = await createClient();
  
  console.log(`[CONFIG_UPDATE] Team: ${teamId} | Repo: ${repoUrl} | Deployment: ${deploymentUrl}`);

  const { data, error } = await supabase
    .from("hf_teams")
    .update({ 
      repo_url: repoUrl,
      deployment_url: deploymentUrl,
      db_connection: dbConnection
    })
    .eq("id", teamId)
    .select();
    
  if (error) {
    console.error("[CONFIG_UPDATE_ERROR]:", error.message);
    return { success: false, error: error.message };
  }
  
  console.log("[CONFIG_UPDATE_SUCCESS]:", data);
  
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
