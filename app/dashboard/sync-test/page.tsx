// app/dashboard/sync-test/page.tsx
"use client";

import { useState } from "react";
import { testSheetConnection } from "@/app/actions/test-sync";

export default function SyncTestPage() {
  const [url, setUrl] = useState("");
  const [results, setResults] = useState<{ success: boolean; headers?: string[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    const res = await testSheetConnection(url);
    setResults(res);
    setLoading(false);
  };

  return (
    <div className="p-10 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">
        Registry Sync Test
      </h1>
      
      <div className="space-y-2">
        <label className="text-[10px] text-slate-500 uppercase font-bold">Google Sheet URL</label>
        <input 
          type="text" 
          placeholder="https://docs.google.com/spreadsheets/d/..." 
          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition-all"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <button 
        onClick={handleTest}
        disabled={loading}
        className="bg-emerald-500 text-black font-bold uppercase text-xs px-6 py-3 rounded-lg hover:bg-emerald-400 disabled:opacity-50 transition-all"
      >
        {loading ? "Establishing Uplink..." : "Test Connection"}
      </button>

      {results && (
        <div className={`p-4 rounded-lg border font-mono text-xs ${results.success ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
          <p className="font-bold mb-2 uppercase">
            Status: {results.success ? "Connection Established" : "Uplink Failed"}
          </p>
          {results.success ? (
            <div className="space-y-1">
              <p>Detected Headers:</p>
              <ul className="list-disc list-inside">
                {results.headers?.map((h: string, i: number) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p>Error: {results.error}</p>
          )}
        </div>
      )}
    </div>
  );
}