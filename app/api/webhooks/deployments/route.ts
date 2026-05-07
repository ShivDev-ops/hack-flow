import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * API Route: /api/webhooks/deployments
 * Description: Unified webhook for Vercel and Netlify deployment updates.
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const userAgent = req.headers.get("user-agent") || "";
    
    let status = "UNKNOWN";
    let url = null;
    let repoUrl = null;
    let error = null;
    let provider = "UNKNOWN";

    // 1. IDENTIFY PROVIDER AND NORMALIZE PAYLOAD
    if (userAgent.includes("Vercel")) {
      provider = "Vercel";
      const type = payload.type;
      url = payload.payload?.deployment?.url ? `https://${payload.payload.deployment.url}` : null;
      repoUrl = payload.payload?.deployment?.meta?.githubCommitRepo || null;
      
      if (type === "deployment.succeeded" || type === "deployment.ready") status = "READY";
      else if (type === "deployment.error") {
        status = "FAILED";
        error = payload.payload?.deployment?.error?.message || "Build Error";
      }
      else if (type === "deployment.created") status = "BUILDING";
    } 
    else if (payload.ssl_url || payload.build_id) { // Simple Netlify Check
      provider = "Netlify";
      const type = payload.type; // Netlify sends event type in payload usually or via headers
      url = payload.ssl_url || payload.url;
      repoUrl = payload.repository_url;
      
      if (payload.state === "ready") status = "READY";
      else if (payload.state === "error" || payload.state === "failed") {
        status = "FAILED";
        error = payload.error_message || "Build Failed";
      }
      else if (payload.state === "building" || payload.state === "enqueued") status = "BUILDING";
    }

    if (!repoUrl) {
      return NextResponse.json({ error: "REPO_NOT_IDENTIFIED" }, { status: 400 });
    }

    const supabase = await createClient();

    // 2. FIND TEAM BY REPO URL
    const normalizedRepo = repoUrl.replace(/\/$/, "").replace(/\.git$/, "");
    const { data: team, error: teamError } = await supabase
      .from("hf_teams")
      .select("id, name")
      .ilike("repo_url", `%${normalizedRepo}%`)
      .maybeSingle();

    if (teamError || !team) {
      return NextResponse.json({ error: "TEAM_NOT_FOUND" }, { status: 404 });
    }

    // 3. UPDATE DEPLOYMENT URL (If ready)
    if (url && status === "READY") {
      await supabase
        .from("hf_teams")
        .update({ deployment_url: url })
        .eq("id", team.id);
    }

    // 4. LOG TELEMETRY (Audit Pulse)
    await supabase.from("hf_telemetry_logs").insert({
      team_id: team.id,
      action_type: status === "FAILED" ? "ERROR" : "SYSTEM",
      table_name: "hf_deployments",
      details: `${provider} Build: ${status} ${error ? `(${error})` : ""} ${url ? `| URL: ${url}` : ""}`
    });

    return NextResponse.json({ success: true, status, provider });

  } catch (err: any) {
    console.error("[DEPLOYMENT_WEBHOOK_CRITICAL]:", err.message);
    return NextResponse.json({ error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
