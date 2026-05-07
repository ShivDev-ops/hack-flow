"use client";

import { useState, useEffect } from "react";
import { getLabSession } from "@/app/actions/lab-auth";
import { getTeamConfig, updateMissionSpecs } from "@/app/actions/lab-config";
import { Loader2, Save, Upload, FileText, GitBranch, Link as LinkIcon } from "lucide-react";

export default function MissionSpecsPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [srsDocument, setSrsDocument] = useState<File | null>(null);
  const [existingSrsPath, setExistingSrsPath] = useState<string | null>(null);
  
  const [session, setSession] = useState<{ teamId?: string; role?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const sessionData = await getLabSession();
      setSession(sessionData);

      if (sessionData?.teamId) {
        const res = await getTeamConfig(sessionData.teamId);
        if (res.success && res.config) {
          setRepoUrl(res.config.repo_url || "");
          setDeploymentUrl(res.config.deployment_url || "");
          setExistingSrsPath(res.config.srs_document_path || null);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

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
    // Basic URL validation
    if (repoUrl && !repoUrl.startsWith('https://')) {
        setError("Please enter a valid GitHub URL starting with 'https://'.");
        return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("teamId", session.teamId);
    formData.append("repoUrl", repoUrl);
    formData.append("deploymentUrl", deploymentUrl);
    if (srsDocument) {
      formData.append("srsDocument", srsDocument);
    }

    try {
      const res = await updateMissionSpecs(formData);
      if (res.success) {
        setSuccess("Mission specs saved successfully!");
        if (res.path) {
          setExistingSrsPath(res.path);
        }
        setSrsDocument(null);
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
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">Mission_Specs</h1>
      <p className="text-white/40 mb-8">Define the core resources for your project. This enables AI progress tracking and automated telemetry.</p>
      
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
            <span className="label-text-alt text-white/40">This must be the main repository the team leader manages.</span>
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
            <span className="label-text text-white flex items-center gap-2"><FileText size={16}/> SRS Document</span>
          </label>
          <div className="flex items-center gap-4">
            <label className={`cursor-pointer bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg transition-colors ${isLead ? 'hover:bg-white/10' : 'opacity-50 cursor-not-allowed'}`}>
                <span className="flex items-center gap-2"><Upload size={16} /> Choose File</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.md,.txt"
                  disabled={!isLead}
                />
            </label>
            {srsDocument && <span className="text-gray-400 text-sm">{srsDocument.name}</span>}
          </div>
          {existingSrsPath && (
            <p className="text-xs text-secondary mt-2">Current SRS is on file. Uploading a new one will replace it.</p>
           )}
        </div>

        {error && <div className="text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">{error}</div>}
        {success && <div className="text-emerald-400 bg-emerald-500/10 p-3 rounded-md border border-emerald-500/20">{success}</div>}

        {isLead && (
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full flex items-center justify-center gap-2 bg-secondary text-black font-bold py-3 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:bg-gray-600"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "Saving Specs..." : "Save Mission Specs"}
            </button>
        )}
      </div>
    </div>
  );
}
