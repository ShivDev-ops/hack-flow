// components/ui/triage-actions.tsx
"use client";

import { useState } from "react";
// Update: Import toggleClaimStatus instead of verifyTeamAction
import { toggleClaimStatus } from "@/app/dashboard/triage/actions"; 
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";

interface TriageActionsProps {
  participantId: string; // Changed from teamId to participantId
  status: boolean;       // Changed from string to boolean
}

export function TriageActions({ participantId, status }: TriageActionsProps) {
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    // Update: Call the correct action
    await toggleClaimStatus(participantId, status);
    setIsPending(false);
  };

  return (
    <div className="flex justify-end">
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
          status 
            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        }`}
      >
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : status ? (
          <><ShieldAlert size={12} /> Unclaim</>
        ) : (
          <><ShieldCheck size={12} /> Manual Claim</>
        )}
      </button>
    </div>
  );
}