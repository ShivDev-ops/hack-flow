"use server";

import { createClient } from "@/lib/supabase/server";
import jwt from "jsonwebtoken";

export async function exportTeamDataAction(teamId: string) {
  const supabase = await createClient();
  
  const { data: teamData, error: teamError } = await supabase
    .from("hf_teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !teamData) {
    throw new Error(teamError?.message || "Team not found");
  }

  const { data: eventData } = await supabase
    .from("hf_events")
    .select("*")
    .eq("id", teamData.event_id)
    .single();

  const { data: teamMembersData } = await supabase
    .from("hf_team_members")
    .select("*")
    .eq("team_id", teamId);

  const { data: tasksData } = await supabase
    .from("hf_tasks")
    .select("*")
    .eq("team_id", teamId);

  const { data: commitsData } = await supabase
    .from("repository_commits")
    .select("*")
    .eq("team_id", teamId);

  const { data: dnaData } = await supabase
    .from("hf_project_dna")
    .select("*")
    .eq("team_id", teamId);

  const { data: judgingData } = await supabase
    .from("hf_judging_results")
    .select("*")
    .eq("team_id", teamId);

  const { data: telemetryData } = await supabase
    .from("hf_telemetry_logs")
    .select("*")
    .eq("team_id", teamId);

  const { data: chatData } = await supabase
    .from("hf_chat_messages")
    .select("*")
    .eq("team_id", teamId);

  const manifest = {
    exportedAt: new Date().toISOString(),
    event: eventData || null,
    team: teamData || null,
    teamMembers: teamMembersData || [],
    tasks: tasksData || [],
    commits: commitsData || [],
    projectDna: dnaData || [],
    judgingResults: judgingData || [],
    telemetryLogs: telemetryData || [],
    chatMessages: chatData || [],
  };

  return manifest;
}

export async function exportToExternalSite(teamId: string, participantEmail: string) {
  const manifest = await exportTeamDataAction(teamId);
  const secret = process.env.EXPORT_JWT_SECRET;
  
  if (!secret) {
    throw new Error("EXPORT_JWT_SECRET is not configured");
  }
  
  const token = jwt.sign(
    { teamId, participantEmail, exportedAt: manifest.exportedAt },
    secret,
    { expiresIn: "1h" }
  );
  
  const importUrl = process.env.EXTERNAL_SITE_IMPORT_URL;
  if (!importUrl) {
    throw new Error("EXTERNAL_SITE_IMPORT_URL is not configured");
  }

  const res = await fetch(importUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token, manifest })
  });

  if (!res.ok) {
    throw new Error(`Failed to export data: ${res.statusText}`);
  }

  return { success: true };
}
