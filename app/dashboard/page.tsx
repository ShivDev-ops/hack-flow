"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Users, Loader2, LayoutGrid, Archive, Sparkles, ShieldCheck, Zap, BarChart3, ChevronRight, Activity } from "lucide-react";
import { EventCard } from "@/components/dashboard/event-card";
import { InitEventModal } from "@/components/dashboard/init-event-modal";
import { createClient } from "@/lib/supabase/client";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { prepareMicrosoftLink } from "@/app/actions/auth-link";
import { getOrganizerDashboardData } from "@/app/actions/dashboard";
import { motion, AnimatePresence } from "framer-motion";

import { Event, Participant } from "@/types/common";

/**
 * UI/UX PRO MAX REVAMP: ORGANIZER_DASHBOARD
 * Style: Elite Command Control / Glassmorphism
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [participantData, setParticipantData] = useState<Pick<Participant, 'id' | 'event_id' | 'team_name'>[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  
  const supabase = useMemo(() => createClient(), []);

  const fetchFleetStatus = useCallback(async (shouldLoad = true) => {
    if (!session) return;
    if (shouldLoad) setLoading(true);
    
    try {
      const res = await getOrganizerDashboardData();
      
      if (res.success) {
        setEvents((res.events as Event[]) || []);
        setParticipantData(res.participants || []);
        setActiveRole(res.role || null);
        
        if (res.needsInitialization) {
            setIsModalOpen(true);
        } else {
            setIsModalOpen(false);
        }
      } else {
          console.error("DASHBOARD_DATA_FAIL:", res.error);
      }
    } catch (error: unknown) {
      console.error("TELEMETRY_SYNC_ERROR:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
        router.push("/login");
    } else if (status === "authenticated") {
        fetchFleetStatus(false);
    }
  }, [status, fetchFleetStatus, router]);

  const totalParticipants = participantData.length;
  const isAdmin = activeRole === 'SUPER_ADMIN' || session?.role === 'SUPER_ADMIN';
  const isLinked = !!session?.user?.azure_ad_id;

  const handleLinkMicrosoft = async () => {
    try {
      await prepareMicrosoftLink();
      signIn("azure-ad", { callbackUrl: "/dashboard" });
    } catch (err) {
      alert("LINK_INIT_FAILED: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const animProps = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }
  };

  if (loading && status === "authenticated") {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <Loader2 className="animate-spin text-secondary" size={64} />
                <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-secondary/40" size={24} />
            </div>
            <div className="text-center space-y-2">
                <p className="text-xs font-black uppercase tracking-[0.6em] text-white animate-pulse">Syncing_Nodes</p>
                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Establishing secure telemetry uplink...</p>
            </div>
        </div>
      );
  }

  return (
    <div className="space-y-16 max-w-[1600px] mx-auto p-6 md:p-12 bg-background min-h-screen selection:bg-secondary/30">
      
      {/* WELCOME HEADER: HIGH_IMPACT */}
      <motion.header {...animProps} className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter uppercase italic leading-[0.85]">
                Welcome back, <br/>
                <span className="text-secondary">{isAdmin ? "Super_Admin" : "Organizer"}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-6 pt-4 ml-1">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                    <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.3em] font-mono">Status: <span className="text-secondary">Nominal</span></p>
                </div>
                <div className="w-px h-4 bg-white/10" />
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-secondary/60" />
                    <p className="text-[11px] text-white/40 font-black uppercase tracking-[0.3em] font-mono">Uplink: <span className="text-secondary">Secure</span></p>
                </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {!isAdmin && !isLinked && (
              <button 
                onClick={handleLinkMicrosoft}
                className="group relative flex items-center gap-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all overflow-hidden active:scale-95"
              >
                <Mail size={16} /> Link Microsoft Account
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
            )}
            {!isAdmin && isLinked && (
              <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                <ShieldCheck size={16} /> Secondary Auth Active
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <Activity size={80} />
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] font-mono">Node_Heartbeat</p>
                <h2 className="text-4xl font-black text-white italic tracking-tighter">99.99<span className="text-secondary">%</span></h2>
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Uptime Certified</p>
            </div>
        </div>
      </motion.header>

      {/* ANALYTICS: ELITE_CARDS */}
      <motion.div {...animProps} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] shadow-2xl group hover:border-secondary/40 transition-all duration-500 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:opacity-10 transition-opacity rotate-12">
            <Users size={200} />
          </div>
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3">
            <Users size={16} className="text-secondary" /> {isAdmin ? "Global Fleet Registry" : "Active Nodes"}
          </p>
          <h2 className="text-6xl font-black text-white mt-6 tracking-tighter italic">
            {totalParticipants.toLocaleString()}
          </h2>
          <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-secondary/60 uppercase tracking-widest">
            <BarChart3 size={12} /> Live Telemetry
          </div>
        </div>
        
        <div className="bg-white/[0.02] border border-white/10 p-10 rounded-[3rem] md:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 shadow-2xl group hover:border-secondary/40 transition-all duration-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="space-y-3 relative z-10">
            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">Access Privilege</p>
            <h2 className="text-4xl md:text-5xl font-black text-secondary uppercase italic tracking-tighter leading-none">
                {isAdmin ? "Global Control" : "Authorized Member"}
            </h2>
            <p className="text-[11px] text-white/20 font-bold uppercase tracking-widest">Mission Protocol Active</p>
          </div>
          {isAdmin && (
              <button 
                onClick={() => router.push("/admin/fleet-cmd")}
                className="relative z-10 w-full sm:w-auto bg-primary text-black font-black px-10 py-6 rounded-3xl uppercase transition-all tracking-[0.2em] text-xs shadow-[0_20px_40px_rgba(168,85,247,0.2)] hover:scale-105 active:scale-95 group flex items-center justify-center gap-3"
              >
                <Sparkles size={20} className="group-hover:rotate-180 transition-transform duration-700" /> 
                System Control
              </button>
          )}
        </div>
      </motion.div>

      {/* ACTION BAR: NAVIGATION */}
      <motion.div {...animProps} className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 gap-10">
        <div className="flex gap-12 font-black uppercase tracking-[0.3em] text-xs">
          <button className="flex items-center gap-3 text-white relative py-4">
            <LayoutGrid size={18} className="text-secondary" /> {isAdmin ? "Fleet Map" : "My Nodes"}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary rounded-full shadow-[0_0_15px_#10b981]" />
          </button>
          {isAdmin && (
            <button className="flex items-center gap-3 text-white/20 hover:text-white/60 transition-all py-4 group">
                <Archive size={18} className="group-hover:text-primary transition-colors" /> Archives
            </button>
          )}
        </div>
        
        {(!session?.eventId || isAdmin) && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-4 bg-white text-black px-12 py-6 rounded-[2rem] font-black text-sm hover:bg-secondary transition-all hover:scale-105 active:scale-95 shadow-2xl tracking-[0.1em] uppercase group"
            >
                <Plus size={24} strokeWidth={4} className="group-hover:rotate-90 transition-transform duration-500" /> New Event
            </button>
        )}
      </motion.div>

      {/* NODE GRID: THE_FLEET */}
      <motion.div {...animProps} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {events.length > 0 ? (
          events.map((event) => {
            const eventParticipants = participantData.filter(p => p.event_id === event.id);
            const teamCount = new Set(eventParticipants.map(p => p.team_name)).size;

            return (
              <EventCard 
                key={event.id} 
                event={event} 
                participantCount={eventParticipants.length}
                teamCount={teamCount}
              />
            );
          })
        ) : (
          <div className="col-span-full py-48 text-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01] group hover:border-secondary/20 transition-all duration-700">
            <div className="mb-10 opacity-20 group-hover:opacity-40 transition-opacity">
                <Box size={80} className="mx-auto" />
            </div>
            <p className="text-white/20 font-black text-lg uppercase tracking-[0.4em] max-w-md mx-auto italic">
                {isAdmin 
                  ? "Sector empty. Deploy new tenants to begin monitoring."
                  : "Registry uninitialized. Launch your first node to start mission."}
            </p>
            {!isAdmin && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-12 px-12 py-5 bg-white/5 hover:bg-secondary hover:text-black text-white rounded-2xl border border-white/10 font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl active:scale-95 flex items-center gap-3 mx-auto"
                >
                  <ChevronRight size={18} /> Start Initialization
                </button>
            )}
          </div>
        )}
      </motion.div>

      {/* MODALS */}
      <InitEventModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchFleetStatus(true);
        }} 
      />
    </div>
  );
}

// Support Icons
function Mail(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function Box(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </svg>
    )
}
