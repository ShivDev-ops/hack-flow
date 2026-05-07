"use client";

import { Book, FileText, Loader2 } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { createClient } from "@/lib/supabase/client";

interface MissionBriefingProps {
  problemStatement: string | null;
  srsDocumentPath: string | null;
}

export function MissionBriefing({ problemStatement, srsDocumentPath }: MissionBriefingProps) {
  
  const getSrsDownloadUrl = () => {
    if (!srsDocumentPath) return null;
    const supabase = createClient();
    const { data } = supabase.storage.from("event_resources").getPublicUrl(srsDocumentPath);
    return data.publicUrl;
  };
  
  if (!problemStatement && !srsDocumentPath) {
    return (
      <div className="glass-panel rim-light rounded-[2rem] p-8 text-center">
        <Loader2 className="animate-spin text-white/20 mx-auto mb-4" />
        <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest">Awaiting Mission Briefing from Command...</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rim-light rounded-[2rem] p-6 md:p-8 space-y-6">
      <header className="flex items-center gap-3">
        <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
          <Book size={18} />
        </div>
        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Mission_Briefing</h2>
      </header>

      {problemStatement && (
        <div className="prose prose-invert prose-sm md:prose-base max-w-none bg-black/20 p-4 rounded-xl border border-white/5" data-color-mode="dark">
            <MDEditor.Markdown source={problemStatement} />
        </div>
      )}

      {srsDocumentPath && (
        <a 
          href={getSrsDownloadUrl() || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 btn btn-outline btn-secondary"
        >
          <FileText size={16} />
          Download Full SRS Document
        </a>
      )}
    </div>
  );
}
