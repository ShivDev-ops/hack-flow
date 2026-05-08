"use client";

import { useState, useEffect } from "react";
import { getLabSession } from "@/app/actions/lab-auth";
import { getTeamConfig, updateMissionSpecs, getTeamAuditResults, triggerTeamReAudit } from "@/app/actions/lab-config";
import { Loader2, Save, Upload, FileText, GitBranch, Link as LinkIcon, CheckCircle2, Circle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuditReportModal } from "@/components/dashboard/audit-report-modal";
import { DNAMilestone, JudgingResult, Team } from "@/types/common";

export default function MissionSpecsPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [srsDocument, setSrsDocument] = useState<File | null>(null);
  const [existingSrsPath, setExistingSrsPath] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<DNAMilestone[]>([]);
  
  const [session, setSession] = useState<{ teamId?: string; role?: string } | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [auditResults, setAuditResults] = useState<JudgingResult | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const sessionData = await getLabSession();
      setSession(sessionData);

      if (sessionData?.teamId) {
        // 1. Fetch Config
        const res = await getTeamConfig(sessionData.teamId);
        if (res.success && res.config) {
          setRepoUrl(res.config.repo_url || "");
          setDeploymentUrl(res.config.deployment_url || "");
          setExistingSrsPath(res.config.srs_document_path || null);
          
          // Get team name etc
          const { data: team } = await supabase.from("hf_teams").select("*").eq("id", sessionData.teamId).single();
          setTeamData(team);
        }

        // 2. Fetch DNA Milestones
        const { data: dna } = await supabase
          .from("hf_project_dna")
          .select("*")
          .eq("team_id", sessionData.teamId)
          .order("created_at", { ascending: true });
        
        setMilestones(dna || []);

        // 3. Fetch Audit Results
        const auditRes = await getTeamAuditResults(sessionData.teamId);
        if (auditRes.success) {
            setAuditResults(auditRes.audit);
        }
      }
      setLoading(false);
    };
    init();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSrsDocument(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!session?.teamId) {
      setError("No active team session found.");
      return;
    }
    
    // Ensure Protocols
    let cleanRepoUrl = repoUrl.trim();
    if (cleanRepoUrl && !cleanRepoUrl.startsWith('http://') && !cleanRepoUrl.startsWith('https://')) {
        cleanRepoUrl = `https://${cleanRepoUrl}`;
    }

    let cleanDeploymentUrl = deploymentUrl.trim();
    if (cleanDeploymentUrl && !cleanDeploymentUrl.startsWith('http://') && !cleanDeploymentUrl.startsWith('https://')) {
        cleanDeploymentUrl = `https://${cleanDeploymentUrl}`;
    }

    // Basic URL validation
    if (cleanRepoUrl && !cleanRepoUrl.startsWith('https://github.com')) {
        setError("Please enter a valid GitHub URL (e.g., https://github.com/org/repo).");
        return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("teamId", session.teamId);
    formData.append("repoUrl", cleanRepoUrl);
    formData.append("deploymentUrl", cleanDeploymentUrl);
    if (srsDocument) {
      formData.append("srsDocument", srsDocument);
    }

    try {
      const res = await updateMissionSpecs(formData);
      if (res.success) {
        setSuccess("Mission specs saved and DNA synthesized!");
        if (res.path) {
          setExistingSrsPath(res.path);
        }
        setSrsDocument(null);
        
        // Refresh milestones
        const { data: dna } = await supabase
          .from("hf_project_dna")
          .select("*")
          .eq("team_id", session.teamId)
          .order("created_at", { ascending: true });
        setMilestones(dna || []);

      } else {
        setError(res.error || "An unknown error occurred.");
      }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save mission specs.";
        setError(errorMessage);
    } finally {
        setSaving(false);
    }
  };

  const handleReAudit = async () => {
      if (!session?.teamId) return;
      setAuditing(true);
      setError(null);
      setSuccess(null);
      try {
          console.log("[RE_AUDIT] Triggering re-audit for team:", session.teamId);
          const res = await triggerTeamReAudit(session.teamId);
          console.log("[RE_AUDIT] Response:", res);
          
          if (res.success) {
              setSuccess("Re-audit complete! DNA updated and report generated.");
              setAuditResults(res.audit ?? null);
              // Refresh milestones
              const { data: dna } = await supabase
                .from("hf_project_dna")
                .select("*")
                .eq("team_id", session.teamId)
                .order("created_at", { ascending: true });
              setMilestones(dna || []);
              
              // Also update progress score in local teamData
              const { data: team } = await supabase.from("hf_teams").select("*").eq("id", session.teamId).single();
              setTeamData(team);
              
              // Open report
              setIsReportOpen(true);
          } else {
              setError(res.error || "Audit failed.");
          }
      } catch (err: any) {
          setError(err.message);
      } finally {
          setAuditing(false);
      }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="animate-spin text-secondary" size={48} />
      </div>
    );
  }

  if (!session?.teamId) {
    return <div className="text-center p-8 text-red-500">You must be part of a team to configure mission specs.</div>
  }

  const isLead = session.role === 'LEAD';

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
      
      {/* LEFT: CONFIG FORM */}
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Mission_Specs</h1>
        <p className="text-white/40 mb-8 text-sm">Define the core resources for your project. This enables AI progress tracking and automated telemetry.</p>
        
        {!isLead && (
           <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl text-sm mb-8">
              <p className="font-bold">Read-Only Mode</p>
              <p>Only the Team Leader can edit these mission specifications.</p>
           </div>
        )}

        <div className="space-y-6">
          {/* GitHub Repo URL */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white flex items-center gap-2"><GitBranch size={16}/> GitHub Repository URL</span>
            </label>
            <input 
              type="url" 
              placeholder="https://github.com/your-team/your-repo" 
              className="w-full bg-white/[0.03] border border-white/10 focus:border-secondary/50 outline-none rounded-xl p-3 text-white font-mono text-sm transition-colors"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              disabled={!isLead}
            />
            <label className="label">
              <span className="label-text-alt text-white/40 text-[10px]">This must be the main repository the team leader manages.</span>
            </label>
          </div>

          {/* Deployment URL */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-white flex items-center gap-2"><LinkIcon size={16}/> Live Deployment URL</span>
            </label>
            <input 
              type="url" 
              placeholder="https://your-project.netlify.app" 
              className="w-full bg-white/[0.03] border border-white/10 focus:border-secondary/50 outline-none rounded-xl p-3 text-white font-mono text-sm transition-colors"
              value={deploymentUrl}
              onChange={e => setDeploymentUrl(e.target.value)}
              disabled={!isLead}
            />
          </div>

          {/* SRS Document */}
          <div>
            <label className="label">
              <span className="label-text text-white flex items-center gap-2"><FileText size={16}/> Project DNA Document</span>
            </label>
            <div className="flex items-center gap-4">
              <label className={`cursor-pointer bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors ${isLead ? 'hover:bg-white/10' : 'opacity-50 cursor-not-allowed'}`}>
                  <span className="flex items-center gap-2 text-sm"><Upload size={16} /> Choose File</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.md,.txt"
                    disabled={!isLead}
                  />
              </label>
              {srsDocument && <span className="text-gray-400 text-xs truncate max-w-[150px]">{srsDocument.name}</span>}
            </div>
            {existingSrsPath && (
              <p className="text-[10px] text-secondary mt-2 uppercase font-bold tracking-widest italic">Document Indexed // Re-upload to refresh DNA</p>
             )}
          </div>

          {error && <div className="text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20 text-xs font-mono">{error}</div>}
          {success && <div className="text-emerald-400 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20 text-xs font-mono">{success}</div>}

          {isLead && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving || loading || auditing}
                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 uppercase text-[10px] tracking-widest"
                  >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                    {saving ? "Saving..." : "Save Config"}
                  </button>

                  <button
                    onClick={handleReAudit}
                    disabled={auditing || loading || saving || !repoUrl}
                    className="flex items-center justify-center gap-2 bg-secondary text-black font-black py-4 rounded-xl hover:bg-emerald-400 transition-all active:scale-95 disabled:opacity-50 disabled:bg-gray-600 uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    {auditing ? <Loader2 className="animate-spin" /> : <Zap size={18} />}
                    {auditing ? "Auditing Repo..." : "Sync & Audit Work"}
                  </button>
              </div>
          )}

          {auditResults && (
              <button 
                onClick={() => setIsReportOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/5 hover:border-white/10 text-white/60 hover:text-white py-3 rounded-xl transition-all text-[10px] uppercase font-bold tracking-[0.2em]"
              >
                  <FileText size={14} /> View Latest Audit Report
              </button>
          )}
        </div>
      </div>

      {/* RIGHT: AI DNA VIEW */}
      <div className="glass-panel rim-light p-8 rounded-[2rem] bg-white/[0.01] border-white/5">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full pulse-emerald" />
                <h2 className="text-sm font-black text-white/40 uppercase tracking-[0.3em]">Project_DNA // Milestones</h2>
            </div>
            {teamData?.ai_progress_score !== undefined && (
                <div className="text-right">
                    <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Progress</p>
                    <p className="text-xl font-black text-secondary italic tracking-tighter">{teamData.ai_progress_score}%</p>
                </div>
            )}
        </div>

        {milestones.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-white/5 rounded-2xl p-6">
            <FileText size={48} className="text-white/10" />
            <p className="text-xs text-white/30 uppercase font-bold tracking-widest leading-relaxed">
                No DNA data detected.<br/>Upload a project document to<br/>initialize AI tracking.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {milestones.map((m) => (
              <div key={m.id} className="relative pl-8 border-l border-white/10 pb-6 last:pb-0">
                <div className="absolute left-[-5px] top-0">
                    {m.status === 'complete' ? (
                        <CheckCircle2 size={10} className="text-secondary bg-background" />
                    ) : m.status === 'in_progress' ? (
                        <Zap size={10} className="text-amber-500 bg-background animate-pulse" />
                    ) : (
                        <Circle size={10} className="text-white/20 bg-background" />
                    )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{m.milestone_title}</h3>
                    <span className="text-[9px] font-mono text-secondary/40 font-bold">W_{m.weight}</span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed italic">{m.milestone_description}</p>
                  <div className="mt-3 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                    <p className="text-[9px] text-white/20 uppercase font-bold tracking-tighter">Verification Criteria</p>
                    <p className="text-[10px] text-secondary/60 font-mono mt-1">{m.verification_criteria}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] text-white/20 uppercase font-black text-center tracking-widest">
                    AI Tracking Active // {milestones.length} Pillars Ingested
                </p>
            </div>
          </div>
        )}
      </div>

      {/* Audit Report Modal */}
      <AuditReportModal 
        isOpen={isReportOpen} 
        onClose={() => setIsReportOpen(false)} 
        team={teamData} 
        results={auditResults} 
        milestones={milestones} 
      />

    </div>
  );
}
