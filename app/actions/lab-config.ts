"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { synthesizeProjectDNA } from "./ai-tracker";

export async function getTeamConfig(teamId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hf_teams")
    .select("repo_url, deployment_url, db_connection, readable_id, srs_document_path, showcase_audit")
    .eq("id", teamId)
    .single();
    
  if (error) return { success: false, error: error.message };
  return { success: true, config: data };
}

export async function updateMissionSpecs(formData: FormData) {
    try {
        const teamId = formData.get('teamId') as string;
        const repoUrl = formData.get('repoUrl') as string;
        const deploymentUrl = formData.get('deploymentUrl') as string;
        const srsDocument = formData.get('srsDocument') as File | null;

        if (!teamId) {
            return { success: false, error: "Team ID is missing." };
        }

        const supabase = await createClient();
        const supabaseAdmin = await createAdminClient();
        let srsPath: string | undefined = undefined;

        if (srsDocument && srsDocument.size > 0) {
            const fileExt = srsDocument.name.split('.').pop();
            const fileName = `srs-${teamId}-${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            // Use Admin client for storage to bypass RLS policies if not configured for public uploads
            const { error: uploadError } = await supabaseAdmin.storage
                .from('team_resources') 
                .upload(filePath, srsDocument, {
                    upsert: true
                });

            if (uploadError) {
                console.error("STORAGE_RLS_VIOLATION:", uploadError);
                return { success: false, error: `Storage Error: ${uploadError.message}. This is likely an RLS policy issue on the 'team_resources' bucket.` };
            }
            srsPath = filePath;

            // Trigger AI DNA Synthesis
            try {
                const buffer = Buffer.from(await srsDocument.arrayBuffer());
                const aiRes = await synthesizeProjectDNA(teamId, buffer);
                if (aiRes.success) {
                    console.log(`[AI_TRACKER] Successfully synthesized ${aiRes.count} milestones for team ${teamId}`);
                } else {
                    console.warn(`[AI_TRACKER] Synthesis failed but file saved: ${aiRes.error}`);
                }
            } catch (aiErr) {
                console.error("[AI_TRACKER_CRITICAL_FAIL]:", aiErr);
            }
        }

        const updateData: { 
            repo_url: string; 
            deployment_url: string;
            srs_document_path?: string 
        } = {
            repo_url: repoUrl,
            deployment_url: deploymentUrl,
        };

        if (srsPath) {
            updateData.srs_document_path = srsPath;
        }

        const { error: dbError } = await supabase
            .from('hf_teams')
            .update(updateData)
            .eq('id', teamId);

        if (dbError) {
            if (srsPath) {
                await supabase.storage.from('team_resources').remove([srsPath]);
            }
            return { success: false, error: `Database Error: ${dbError.message}` };
        }

        revalidatePath("/lab/specs");
        return { success: true, path: srsPath };

    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected server error occurred.";
        return { success: false, error: `A critical server error occurred: ${errorMessage}` };
    }
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

export async function getTeamAuditResults(teamId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("hf_judging_results")
        .select("*")
        .eq("team_id", teamId)
        .single();
    
    if (error) return { success: false, error: error.message };
    return { success: true, audit: data };
}

export async function triggerTeamReAudit(teamId: string) {
    console.log(`[ACTION] triggerTeamReAudit called for team: ${teamId}`);
    const { reAuditTeamWork } = await import("./ai-tracker");
    const res = await reAuditTeamWork(teamId);
    console.log(`[ACTION] reAuditTeamWork result:`, res.success ? "SUCCESS" : "FAILED", res.error || "");
    if (res.success) {
        revalidatePath("/lab/specs");
        revalidatePath("/lab/leaderboard");
    }
    return res;
}

export async function toggleShowcaseAudit(teamId: string, enabled: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hf_teams")
    .update({ showcase_audit: enabled })
    .eq("id", teamId);
    
  if (error) return { success: false, error: error.message };
  revalidatePath("/lab/leaderboard");
  revalidatePath("/lab/config");
  return { success: true };
}
