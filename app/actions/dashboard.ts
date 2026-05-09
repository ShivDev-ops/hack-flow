"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getOrganizerDashboardData() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id && !session?.user?.name) {
    return { success: false, error: "UNAUTHORIZED" };
  }

  try {
    const supabase = await createAdminClient();
    
    // 1. Resolve Profile using multiple identifiers for resilience
    const userId = session.user.id;
    const accessId = session.user.name;

    console.log(`[DASHBOARD_DATA] Fetching for User: ${userId} | AccessID: ${accessId}`);

    let profileQuery = supabase.from("hf_organizer_credentials").select("id, event_id, role, access_id");
    
    if (userId) {
        profileQuery = profileQuery.eq("id", userId);
    } else {
        profileQuery = profileQuery.eq("access_id", accessId);
    }

    const { data: profile, error: profileError } = await profileQuery.maybeSingle();

    if (profileError || !profile) {
        console.error("[DASHBOARD_DATA] Profile resolution failed:", profileError?.message);
        throw new Error("Could not retrieve organizer profile.");
    }

    const isAdmin = profile.role === 'SUPER_ADMIN';
    const activeEventId = profile.event_id;

    console.log(`[DASHBOARD_DATA] Profile Resolved: ${profile.access_id} | Role: ${profile.role} | Event: ${activeEventId}`);

    // 2. Fetch Events
    let eventQuery = supabase.from('hf_events').select('*').order('created_at', { ascending: false });
    if (!isAdmin) {
        if (!activeEventId) {
            console.log("[DASHBOARD_DATA] No event linked. Requesting initialization.");
            return { success: true, needsInitialization: true, events: [], participants: [] };
        }
        eventQuery = eventQuery.eq('id', activeEventId);
    }

    const { data: events, error: eventError } = await eventQuery;
    if (eventError) throw eventError;

    // 3. Fetch Participants
    let partQuery = supabase.from('hf_participants').select('id, event_id, team_name');
    if (!isAdmin && activeEventId) {
        partQuery = partQuery.eq('event_id', activeEventId);
    }

    const { data: participants, error: partError } = await partQuery;
    if (partError) throw partError;

    return {
      success: true,
      needsInitialization: false,
      events: events || [],
      participants: participants || [],
      role: profile.role,
      eventId: activeEventId
    };

  } catch (error: any) {
    console.error("[DASHBOARD_DATA_ERROR]:", error.message);
    return { success: false, error: error.message };
  }
}
