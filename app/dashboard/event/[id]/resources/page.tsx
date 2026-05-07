"use client";

import { useState, useEffect } from "react";
import { useParams } from 'next/navigation';
import { getEventDetails, updateEventResources } from "@/app/actions/events";
import MDEditor from "@uiw/react-md-editor";
import { Loader2, Save, Upload, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EventResourcesPage() {
  const params = useParams();
  const eventId = params.id as string;

  const [problemStatement, setProblemStatement] = useState<string | undefined>("");
  const [srsDocument, setSrsDocument] = useState<File | null>(null);
  const [existingSrsPath, setExistingSrsPath] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventData = async () => {
      setLoading(true);
      const res = await getEventDetails(eventId);
      if (res.success && res.data) {
        setEventName(res.data.name);
        setProblemStatement(res.data.problem_statement || `**Problem Statement:**

*   **Goal:** ...
*   **Key Features:** ...

**Rules:**

1.  ...
2.  ...`);
        setExistingSrsPath(res.data.srs_document_path);
      } else {
        setError(res.error || "Failed to fetch event details.");
      }
      setLoading(false);
    };

    fetchEventData();
  }, [eventId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSrsDocument(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    const formData = new FormData();
    formData.append("eventId", eventId);
    formData.append("problemStatement", problemStatement || "");
    if (srsDocument) {
      formData.append("srsDocument", srsDocument);
    }

    try {
      const res = await updateEventResources(formData);
      if (res.success && res.path) {
        setExistingSrsPath(res.path);
        setSrsDocument(null); // Clear the file input after successful upload
      } else {
        setError(res.error || "An unknown error occurred.");
      }
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to save resources.";
        setError(errorMessage);
    } finally {
        setSaving(false);
    }
  };

  const getSrsDownloadUrl = () => {
    if (!existingSrsPath) return null;
    const supabase = createClient();
    const { data } = supabase.storage.from("event_resources").getPublicUrl(existingSrsPath);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-secondary" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <Link href="/dashboard" className="flex items-center text-sm text-secondary mb-6 hover:text-white transition-colors">
        <ArrowLeft size={16} className="mr-2" />
        Back to Dashboard
      </Link>
      
      <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Manage Resources</h1>
      <p className="text-gray-400 mb-8">For event: <span className="font-semibold text-secondary">{eventName}</span></p>

      <div className="space-y-8">
        <div>
          <label className="block text-lg font-semibold mb-3 text-white">Problem Statement / Rules</label>
          <div className="bg-background border border-white/10 rounded-xl" data-color-mode="dark">
            <MDEditor
              value={problemStatement}
              onChange={setProblemStatement}
              height={400}
              preview="edit"
            />
          </div>
           <p className="text-xs text-gray-500 mt-2">A full-featured Markdown editor. Use the toolbar or type characters like `#` or `**` to format.</p>
        </div>

        <div>
          <label className="block text-lg font-semibold mb-3 text-white">SRS Document (PDF, DOCX, MD)</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
                <span className="flex items-center gap-2"><Upload size={16} /> Choose File</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.docx,.md,.txt"
                />
            </label>
            {srsDocument && <span className="text-gray-400 text-sm">{srsDocument.name}</span>}
          </div>
           {existingSrsPath && (
            <div className="mt-4 flex items-center gap-2">
                <FileText size={16} className="text-secondary" />
                <a href={getSrsDownloadUrl() || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-secondary hover:underline">
                    View Current SRS Document
                </a>
            </div>
           )}
        </div>

        {error && <div className="text-red-500 bg-red-500/10 p-3 rounded-md border border-red-500/20">{error}</div>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-secondary text-black font-bold py-3 rounded-lg hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:bg-gray-600"
        >
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? "Saving..." : "Save All Resources"}
        </button>
      </div>
    </div>
  );
}
