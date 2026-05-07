import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const event = req.headers.get("x-github-event");

    console.log(`[GITHUB_WEBHOOK] Event: ${event} | Signature Presence: ${!!signature}`);

    // 1. Security Check: Verify GitHub Webhook Secret (Only if configured)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const hmac = crypto.createHmac("sha256", webhookSecret);
      const digest = "sha256=" + hmac.update(payload).digest("hex");

      if (signature !== digest) {
        console.error("[GITHUB_WEBHOOK] Signature mismatch.");
        return NextResponse.json({ error: "UNAUTHORIZED_PAYLOAD" }, { status: 401 });
      }
    }

    const data = JSON.parse(payload);

    // Handle GitHub Ping Event
    if (event === 'ping') {
      console.log("[GITHUB_WEBHOOK] Handling Ping.");
      return NextResponse.json({ success: true, message: "PONG" });
    }

    if (event !== 'push' && event !== 'pull_request') {
      console.log(`[GITHUB_WEBHOOK] Ignoring event: ${event}`);
      return NextResponse.json({ status: "IGNORED_EVENT" });
    }

    const supabase = await createClient();

    // 2. Identify the Team by Repository URL
    const rawRepoUrl = data.repository.html_url;
    const normalizedRepoUrl = rawRepoUrl.replace(/\/$/, '').replace(/\.git$/, '');
    
    console.log(`[GITHUB_WEBHOOK] Processing ${event} for: ${normalizedRepoUrl}`);

    // Try exact match first
    let { data: team, error: teamError } = await supabase
      .from("hf_teams")
      .select("id, name")
      .eq("repo_url", rawRepoUrl)
      .maybeSingle();

    if (teamError) {
       console.error("[GITHUB_WEBHOOK] Supabase Team Lookup Error:", teamError.message);
       throw teamError;
    }

    if (!team) {
      console.log("[GITHUB_WEBHOOK] No exact match, trying fuzzy match...");
      const { data: fallbackTeam } = await supabase
        .from("hf_teams")
        .select("id, name")
        .ilike("repo_url", `%${normalizedRepoUrl}%`)
        .maybeSingle();
      team = fallbackTeam;
    }

    if (!team) {
      console.error(`[GITHUB_WEBHOOK] REPO_NOT_MAPPED: ${rawRepoUrl}`);
      return NextResponse.json({ status: "REPO_NOT_MAPPED", details: rawRepoUrl });
    }

    // 3. Handle Push Event (Commits)
    if (event === 'push') {
      if (!data.commits || data.commits.length === 0) {
        console.log("[GITHUB_WEBHOOK] Push received but no commits found.");
        return NextResponse.json({ status: "NO_COMMITS_IN_PUSH" });
      }

      const commits = data.commits.map((commit: any) => ({
        team_id: team!.id,
        commit_sha: commit.id,
        message: commit.message,
        author_handle: commit.author.username || commit.author.name,
        commit_url: commit.url,
        created_at: commit.timestamp
      }));

      const { error: insertError } = await supabase.from("repository_commits").insert(commits);

      if (insertError) {
        console.error(`[GITHUB_WEBHOOK] Insert Error: ${insertError.message}`);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      console.log(`[GITHUB_WEBHOOK] Successfully ingested ${commits.length} commits for ${team.name}.`);
      return NextResponse.json({ success: true });
    }

    // 4. Handle Pull Request Event (Task Automation)
    if (event === 'pull_request') {
      const action = data.action;
      if (action !== 'opened' && action !== 'edited') {
        return NextResponse.json({ status: "PR_ACTION_IGNORED", action });
      }

      const prBody = data.pull_request.body || "";
      const prTitle = data.pull_request.title || "";
      const combinedText = `${prTitle} ${prBody}`;
      
      // Regex: fixes #task-id, resolves task-id, linked to #task-id
      const taskRegex = /(?:fixes|closes|resolves|linked to)\s+#?([a-zA-Z0-9-]+)/gi;
      const matches = [...combinedText.matchAll(taskRegex)];
      
      if (matches.length === 0) {
        return NextResponse.json({ status: "NO_TASK_REFERENCE_FOUND" });
      }

      const taskIds = Array.from(new Set(matches.map(match => match[1])));
      
      const { data: updatedTasks, error: updateError } = await supabase
        .from("hf_tasks")
        .update({ status: 'Review' })
        .in("id", taskIds)
        .eq("team_id", team.id)
        .select("id, title");

      if (updateError) {
        console.error("[GITHUB_WEBHOOK] PR Task Update Error:", updateError.message);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      if (updatedTasks && updatedTasks.length > 0) {
        const logEntries = updatedTasks.map(task => ({
          team_id: team!.id,
          action_type: "UPDATE",
          table_name: "hf_tasks",
          details: `Neural Link: Objective moved to Review via PR #${data.pull_request.number} (${task.title})`
        }));
        await supabase.from("hf_telemetry_logs").insert(logEntries);
      }

      console.log(`[GITHUB_WEBHOOK] Auto-moved ${updatedTasks?.length || 0} tasks to Review for ${team.name}.`);
      return NextResponse.json({ success: true, updatedTaskCount: updatedTasks?.length || 0 });
    }

    return NextResponse.json({ status: "UNHANDLED_EVENT" });

  } catch (err: any) {
    console.error("[GITHUB_WEBHOOK] CRITICAL_CRASH:", err.message);
    return NextResponse.json({ 
      error: "INTERNAL_SERVER_ERROR", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}