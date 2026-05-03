"use client";

import { useState } from "react";
import { togglePaymentVerificationAction } from "@/app/actions/triage";
import { Loader2, DollarSign, Ban } from "lucide-react";

interface PaymentToggleProps {
  participantId: string;
  status: boolean;
}

export function PaymentToggle({ participantId, status }: PaymentToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    const result = await togglePaymentVerificationAction(participantId, status);
    
    if (!result.success) {
      alert(`Payment Error: ${result.message}`);
    }
    
    setIsUpdating(false);
  };

  return (
    <div className="flex justify-center">
      <button
        onClick={handleToggle}
        disabled={isUpdating}
        title={status ? "Mark as UNVERIFIED" : "Mark as PAID & VERIFIED"}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-tighter transition-all ${
          status 
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20" 
            : "bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20"
        }`}
      >
        {isUpdating ? (
          <Loader2 size={10} className="animate-spin" />
        ) : status ? (
          <>
            <DollarSign size={10} strokeWidth={3} /> Paid
          </>
        ) : (
          <>
            <Ban size={10} strokeWidth={3} /> Unverified
          </>
        )}
      </button>
    </div>
  );
}