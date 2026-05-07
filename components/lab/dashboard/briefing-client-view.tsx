"use client";

import MDEditor from "@uiw/react-md-editor";
import { FileText } from "lucide-react";

interface BriefingClientViewProps {
  problemStatement: string | null;
  srsDocumentPath: string | null;
  srsDownloadUrl: string | null;
}

export function BriefingClientView({ problemStatement, srsDocumentPath, srsDownloadUrl }: BriefingClientViewProps) {
  return (
    <>
      <div className="prose prose-invert prose-lg max-w-none" data-color-mode="dark">
        {problemStatement ? (
          <MDEditor.Markdown source={problemStatement} />
        ) : (
          <p className="italic text-white/50">No problem statement has been uploaded by the organizer yet.</p>
        )}
      </div>

      {srsDocumentPath && (
        <div className="pt-8 border-t border-white/10">
          <a
            href={srsDownloadUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-secondary text-black font-bold py-2 px-4 rounded-lg hover:bg-emerald-400 transition-colors"
          >
            <FileText size={16} />
            Download Full SRS Document
          </a>
        </div>
      )}
    </>
  );
}
