import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  // 1. Security Check: Verify GitHub Webhook Secret
  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  if (signature !== digest) {
    return NextResponse.json({ error: "UNAUTHORIZED_PAYLOAD" }, { status: 401 });
  }

  const data = JSON.parse(payload);
  const supabase = await createClient();

  // 2. Identify the Team by Repository URL
  const repoUrl = data.repository.html_url;
  const { data: team } = await supabase
    .from("hf_teams")
    .select("id")
    .eq("repo_url", repoUrl)
    .single();

  if (!team) return NextResponse.json({ status: "REPO_NOT_MAPPED" });

  // 3. Process Commits
  const commits = data.commits.map((commit: any) => ({
    team_id: team.id,
    commit_sha: commit.id,
    message: commit.message,
    author_handle: commit.author.username,
    commit_url: commit.url,
    created_at: commit.timestamp
  }));

  const { error } = await supabase.from("repository_commits").insert(commits);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}