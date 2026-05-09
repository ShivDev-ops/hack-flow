"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Users, Loader2, LayoutGrid, Archive, Sparkles, ShieldCheck } from "lucide-react";
import { EventCard } from "@/components/dashboard/event-card";
import { InitEventModal } from "@/components/dashboard/init-event-modal";
import { createClient } from "@/lib/supabase/client";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { prepareMicrosoftLink } from "@/app/actions/auth-link";

import { Event, Participant } from "@/types/common";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [participantData, setParticipantData] = useState<Pick<Participant, 'id' | 'event_id' | 'team_name'>[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const supabase = useMemo(() => createClient(), []);

  const fetchFleetStatus = useCallback(async (shouldLoad = true) => {
    if (!session) return;
    if (shouldLoad) setLoading(true);
    try {
      let eventQuery = supabase.from('hf_events').select('*').order('created_at', { ascending: false });
      let participantQuery = supabase.from('hf_participants').select('id, event_id, team_name');

      // TENANT SCOPING
      if (session.role === 'ORGANIZER') {
          if (session.eventId) {
              eventQuery = eventQuery.eq('id', session.eventId);
              participantQuery = participantQuery.eq('event_id', session.eventId);
          } else {
              setEvents([]);
              setParticipantData([]);
              if (shouldLoad) setLoading(false);
              setIsModalOpen(true); // Auto-open if no event linked
              return;
          }
      }

      const [eventsRes, participantsRes] = await Promise.all([
        eventQuery,
        participantQuery
      ]);

      if (eventsRes.error) throw eventsRes.error;
      
      setEvents(eventsRes.data || []);
      setParticipantData(participantsRes.data || []);
    } catch (error: unknown) {
      console.error("TELEMETRY_SYNC_ERROR:", error instanceof Error ? error.message : "Unknown error");
    } finally {
      if (shouldLoad) setLoading(false);
    }
  }, [supabase, session]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
        router.push("/login");
    } else if (status === "authenticated") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchFleetStatus(false);
    }
  }, [status, fetchFleetStatus, router]);

  const totalParticipants = participantData.length;
  const isAdmin = session?.role === 'SUPER_ADMIN';
  const isLinked = !!session?.user?.azure_ad_id;

  const handleLinkMicrosoft = async () => {
    try {
      await prepareMicrosoftLink();
      signIn("azure-ad", { callbackUrl: "/dashboard" });
    } catch (err) {
      alert("LINK_INIT_FAILED: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <div className="space-y-12 max-w-[1440px] mx-auto p-6 md:p-10 bg-background min-h-screen selection:bg-secondary/30">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-none">
            Welcome back, <span className="text-secondary font-black">{isAdmin ? "Super_Admin" : "Organizer"}</span>
          </h1>
          <div className="flex items-center gap-4 mt-3 ml-1">
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em] font-label-caps">
              System_Status: <span className="text-secondary">Stable</span> {" // "} Node_Handshake: <span className="text-secondary">Verified</span>
            </p>
            {!isAdmin && !isLinked && (
              <button 
                onClick={handleLinkMicrosoft}
                className="text-[9px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                Link Microsoft Account
              </button>
            )}
            {!isAdmin && isLinked && (
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={10} />
                Microsoft Linked
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-6 py-3 rounded-2xl rim-light">
          <div className="w-2 h-2 bg-secondary rounded-full pulse-emerald" />
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest font-data-mono">Uptime: 99.99%</span>
        </div>
      </header>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rim-light p-8 rounded-3xl shadow-xl group hover:border-secondary/30 transition-all duration-500">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2 font-label-caps">
            <Users size={12} className="text-secondary" /> {isAdmin ? "Total Fleet Registry" : "Event Registry"}
          </p>
          <h2 className="text-5xl font-black text-white mt-4 tracking-tighter font-data-mono">
            {loading ? <Loader2 className="animate-spin text-white/10" size={32} /> : totalParticipants.toLocaleString()}
          </h2>
        </div>
        
        <div className="glass-panel rim-light p-8 rounded-3xl md:col-span-2 flex justify-between items-center shadow-xl group hover:border-secondary/30 transition-all duration-500">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest font-label-caps">Protocol Tier</p>
            <h2 className="text-3xl font-black text-secondary uppercase italic tracking-tighter">
                {isAdmin ? "Global Infrastructure" : "Standard Organizer"}
            </h2>
          </div>
          {isAdmin && (
              <button 
                onClick={() => {
                    console.log("NAVIGATING_TO_OVERRIDE: Role is SUPER_ADMIN");
                    router.push("/admin/fleet-cmd");
                }}
                className="bg-primary/20 hover:bg-primary/40 text-primary text-[10px] font-black px-6 py-4 rounded-2xl border border-primary/30 uppercase transition-all tracking-[0.2em] font-label-caps active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.2)] flex items-center gap-2 group animate-pulse hover:animate-none"
              >
                <Sparkles size={14} className="group-hover:rotate-180 transition-transform duration-500" /> 
                EXECUTE_GLOBAL_OVERRIDE
              </button>
          )}
        </div>
      </div>

      {/* Command Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-white/5 pb-4 gap-6">
        <div className="flex gap-8 text-[11px] font-black uppercase tracking-[0.2em] font-label-caps">
          <button className="flex items-center gap-2 text-white border-b-2 border-secondary pb-4 transition-all">
            <LayoutGrid size={14} /> {isAdmin ? "Fleet Overview" : "Node Control"}
          </button>
          {isAdmin && (
            <button className="flex items-center gap-2 text-white/20 pb-4 hover:text-white/60 transition-all">
                <Archive size={14} /> Archived Nodes
            </button>
          )}
        </div>
        
        {(!session?.eventId || isAdmin) && (
            <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 bg-secondary text-black text-xs font-black px-10 py-5 rounded-[1.5rem] hover:bg-[#5affb4] hover:scale-[1.02] active:scale-[0.98] transition-all mb-2 shadow-[0_0_40px_rgba(78,222,163,0.15)] font-label-caps tracking-widest uppercase"
            >
                <Plus size={20} strokeWidth={4} /> Initialize_New_Event
            </button>
        )}
      </div>

      {/* Node Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-20">
          <Loader2 className="animate-spin text-white" size={48} />
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white font-label-caps">Syncing_Fleet_Data</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <div className="col-span-full py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
              <p className="text-white/20 font-data-mono text-sm uppercase tracking-[0.3em]">
                  {session?.role === 'ORGANIZER' 
                    ? "Initialize your first node to begin mission." 
                    : "No active nodes detected in current sector. Access Global Override to generate tenants."}
              </p>
              {session?.role === 'ORGANIZER' ? (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="mt-8 px-8 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Start Initialization
                  </button>
              ) : (
                <button 
                    onClick={() => router.push("/admin/fleet-cmd")}
                    className="mt-8 px-8 py-3 bg-[#a855f7]/10 hover:bg-[#a855f7]/20 text-[#a855f7] rounded-xl border border-[#a855f7]/30 text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                  >
                    Go to Global Override
                  </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
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
