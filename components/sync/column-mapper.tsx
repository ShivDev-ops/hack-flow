"use client";

import { useState } from "react";

// The fields our database needs
const SYSTEM_FIELDS = [
  { id: "team_name", label: "Team Name" },
  { id: "team_size", label: "Number of Participants" },
  { id: "leader_name", label: "Leader Full Name" },
  { id: "leader_reg", label: "Leader Registration Number" },
  { id: "payment_id", label: "Transaction / Payment ID" },
  { id: "payment_url", label: "Payment Screenshot (URL)" },
];

export function ColumnMapper({ headers, onSave }: { headers: string[], onSave: (map: Record<string, string>) => void }) {
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const handleSelect = (systemField: string, sheetHeader: string) => {
    setMapping(prev => ({ ...prev, [systemField]: sheetHeader }));
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h3 className="text-lg font-bold text-white uppercase tracking-tight">Data Mapping</h3>
        <p className="text-xs text-slate-400">Match your Google Sheet columns to the HaaS Registry.</p>
      </div>

      <div className="grid gap-4">
        {SYSTEM_FIELDS.map((field) => (
          <div key={field.id} className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
            <label className="text-sm font-medium text-slate-300">{field.label}</label>
            <select 
              className="bg-zinc-900 text-white text-xs border border-white/20 rounded p-2 focus:border-emerald-500 outline-none w-1/2"
              onChange={(e) => handleSelect(field.id, e.target.value)}
              value={mapping[field.id] || ""}
            >
              <option value="">-- Select Column --</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        ))}
      </div>

      <button 
        onClick={() => onSave(mapping)}
        disabled={Object.keys(mapping).length < SYSTEM_FIELDS.length}
        className="w-full bg-emerald-500 text-black font-bold py-3 rounded-lg uppercase text-xs hover:bg-emerald-400 disabled:opacity-30 transition-all"
      >
        Confirm & Initialize Node
      </button>
    </div>
  );
}