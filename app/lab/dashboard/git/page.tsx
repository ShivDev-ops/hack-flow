"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getLabSession } from "@/app/actions/lab-auth";
import { Loader2 } from "lucide-react";

import { Commit } from "@/types/common";
import { GitFeed } from "@/components/lab/dashboard/git-feed";
import { ObservabilityPanel } from "@/components/lab/dashboard/observability-panel";
import { getSystemObservability } from "@/lib/lab-config/observability";
import { AIChatAgent } from "@/components/lab/dashboard/ai-chat-agent";

export default function GitPage() {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [session, setSession] = useState<{ memberId: string; teamId: string; role: string } | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string | null>(null);
  const [dbEndpoint, setDbEndpoint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = useMemo(() => createClient(), []);

  const fetchData = useCallback(async (activeTeamId: string) => {
    const { data } = await supabase
      .from("repository_commits")
      .select("*")
      .eq("team_id", activeTeamId)
      .order("created_at", { ascending: false })
      .limit(30);

    setCommits(data || []);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      try {
        const sessionData = await getLabSession();
        if (!sessionData) {
          setLoading(false);
          return;
        }
        setSession(sessionData);

        const activeTeamId = sessionData.teamId;
        if (!activeTeamId) {
          setLoading(false);
          return;
        }

        const { data: config } = await supabase
          .from("hf_teams")
          .select("deployment_url, db_connection")
          .eq("id", activeTeamId)
          .single();

        if (config) {
          setDeploymentUrl(config.deployment_url);
          setDbEndpoint(config.db_connection);
        }

        await fetchData(activeTeamId);
      } catch (error) {
        console.error("Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [supabase, fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-full selection:bg-secondary/30">
      <header className="flex flex-col gap-6 relative z-10 border-b border-white/5 pb-8">
        <ObservabilityPanel deploymentUrl={deploymentUrl} dbEndpoint={dbEndpoint} />
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
          Neural <span className="text-white/20">Feed</span>
        </h1>
      </header>

      <div className="relative z-10">
        <GitFeed 
          commits={commits} 
          onHoverCommit={() => {}}
          onStartWiring={() => {}} // Neural Link wires are disabled on separate pages
        />
      </div>
    </div>
  );
}
