// app/gateway/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyPinAndFetchTeams, fetchTeamMembersForGateway } from "@/app/actions/gateway";
import { ArrowRight, ChevronLeft, ShieldCheck, Users, Search, Terminal, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TeamMemberInfo {
  id: string;
  name: string;
  role: string;
}

export default function GatewayPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<string[]>([]);
  const [eventId, setEventId] = useState("");
  const [eventName, setEventName] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [isPromoted, setIsPromoted] = useState(false);
  const [readableId, setReadableId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMemberInfo[]>([]);
  const [error, setError] = useState("");

  const handlePinSubmit = async () => {
    if (!pin.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await verifyPinAndFetchTeams(pin);
      if (res.success && res.teams) {
        setTeams(res.teams);
        setEventId(res.eventId || "");
        setEventName(res.eventName || "Hackathon Event");
        setStep(2);
      } else {
        setError(res.error || "Invalid Event PIN. Check with your organizers.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = async (teamName: string) => {
    setSelectedTeam(teamName);
    setError("");
    setLoading(true);
    try {
      const res = await fetchTeamMembersForGateway(eventId, teamName);
      if (res.success) {
        setIsPromoted(!!res.isPromoted);
        setReadableId(res.readableId || null);
        setMembers(res.participants || []);
        setStep(3);
      } else {
        setError(res.error || "Could not load team members.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter((t) =>
    t.toLowerCase().includes(teamSearch.toLowerCase().trim())
  );

  return (
    <div className="min-h-screen bg-black text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            HACK-FLOW PROTOCOL v2.6
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Hack-Flow <span className="text-emerald-500">Gateway</span>
          </h1>
          <p className="text-slate-400 text-xs tracking-wider uppercase">
            {step === 1 && "Enter Event PIN to Connect"}
            {step === 2 && `${eventName} — Select Your Team`}
            {step === 3 && `${selectedTeam} — Node Access`}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === s
                  ? "w-10 bg-emerald-500"
                  : step > s
                  ? "w-6 bg-zinc-600"
                  : "w-6 bg-zinc-800"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: EVENT PIN */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                  Event Access PIN
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-xl p-5 text-center text-4xl font-mono text-emerald-400 focus:border-emerald-500 focus:bg-zinc-900/80 outline-none transition-all tracking-widest placeholder:text-zinc-700"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                />
              </div>

              <button
                onClick={handlePinSubmit}
                disabled={loading || !pin.trim()}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black py-4 rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 font-mono text-sm"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Verify Event Access <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* STEP 2: TEAM SELECTION */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
                <span className="text-xs font-mono text-zinc-500">
                  {teams.length} Teams Registered
                </span>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search team name..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-emerald-500 outline-none transition-colors"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredTeams.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs font-mono">
                    No matching teams found
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <button
                      key={team}
                      onClick={() => handleSelectTeam(team)}
                      disabled={loading}
                      className="w-full text-left p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-xs font-bold text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                          {team}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: IDENTITY & TERMINAL ACCESS */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <button
                  onClick={() => setStep(2)}
                  className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Change Team
                </button>
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </div>
              </div>

              {/* Deployment Status */}
              {isPromoted && readableId ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">
                    Lab Node Ready
                  </span>
                  <div className="text-2xl font-mono font-black text-white tracking-widest">
                    ID: {readableId}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Use this Team ID with your team PIN to log into the terminal.
                  </p>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-amber-400 font-bold">
                    Team Node Deployment Pending
                  </span>
                  <p className="text-xs text-zinc-300">
                    Your team has not yet been launched by the hackathon organizers. Please check back shortly or alert an organizer.
                  </p>
                </div>
              )}

              {/* Team Members Roster */}
              <div className="space-y-2">
                <div className="text-xs uppercase font-mono tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Roster ({members.length})</span>
                  <span>Role</span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 text-xs"
                    >
                      <span className="font-medium text-white">{m.name}</span>
                      <span
                        className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${
                          m.role === "LEAD" || m.role === "LEADER"
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              {isPromoted && readableId ? (
                <button
                  onClick={() => router.push(`/lab/login`)}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl uppercase tracking-wider transition-colors flex items-center justify-center gap-2 font-mono text-sm shadow-lg shadow-emerald-500/20"
                >
                  <Terminal className="w-4 h-4" /> Proceed to Lab Login
                </button>
              ) : (
                <button
                  onClick={() => handleSelectTeam(selectedTeam)}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-mono py-3 rounded-xl uppercase tracking-wider text-xs transition-colors"
                >
                  Refresh Node Status
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}