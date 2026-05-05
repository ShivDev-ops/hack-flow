import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256");
  const event = req.headers.get("x-github-event");

  console.log(`[GITHUB_WEBHOOK] Received event: ${event}`);

  // 1. Security Check: Verify GitHub Webhook Secret (Only if configured)
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
  if (webhookSecret) {
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = "sha256=" + hmac.update(payload).digest("hex");

    if (signature !== digest) {
      console.error("[GITHUB_WEBHOOK] Signature mismatch. Unauthorized payload.");
      return NextResponse.json({ error: "UNAUTHORIZED_PAYLOAD" }, { status: 401 });
    }
  } else {
    console.warn("[GITHUB_WEBHOOK] WARNING: GITHUB_WEBHOOK_SECRET not set. Skipping signature verification.");
  }

  const data = JSON.parse(payload);

  // Handle GitHub Ping Event
  if (event === 'ping') {
    console.log("[GITHUB_WEBHOOK] Ping successful.");
    return NextResponse.json({ success: true, message: "PONG" });
  }

  if (event !== 'push') {
    return NextResponse.json({ status: "IGNORED_EVENT" });
  }

  const supabase = await createClient();

  // 2. Identify the Team by Repository URL
  // Normalize URL for matching (remove trailing slash and .git)
  const rawRepoUrl = data.repository.html_url;
  const normalizedRepoUrl = rawRepoUrl.replace(/\/$/, '').replace(/\.git$/, '');
  
  console.log(`[GITHUB_WEBHOOK] Normalizing repo lookup: ${normalizedRepoUrl}`);

  // Try exact match first, then fallback to normalized search
  let { data: team } = await supabase
    .from("hf_teams")
    .select("id, name")
    .eq("repo_url", rawRepoUrl)
    .maybeSingle();

  if (!team) {
    // If exact match fails, try matching by base URL
    const { data: fallbackTeam } = await supabase
      .from("hf_teams")
      .select("id, name")
      .ilike("repo_url", `%${normalizedRepoUrl}%`)
      .maybeSingle();
    team = fallbackTeam;
  }

  if (!team) {
    console.error(`[GITHUB_WEBHOOK] No team found for repo: ${rawRepoUrl}`);
    return NextResponse.json({ status: "REPO_NOT_MAPPED", details: rawRepoUrl });
  }

  console.log(`[GITHUB_WEBHOOK] Mapping push to Team: ${team.name} (ID: ${team.id})`);

  // 3. Process Commits
  if (!data.commits || data.commits.length === 0) {
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

  console.log(`[GITHUB_WEBHOOK] Ingesting ${commits.length} commits...`);

  const { error } = await supabase.from("repository_commits").insert(commits);

  if (error) {
    console.error(`[GITHUB_WEBHOOK] Database Insert Error: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log("[GITHUB_WEBHOOK] Successfully synchronized.");
  return NextResponse.json({ success: true });
}