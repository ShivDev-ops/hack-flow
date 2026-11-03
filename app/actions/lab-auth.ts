"use server";

import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

import jwt from "jsonwebtoken";

const LAB_SESSION_SECRET = process.env.SUPABASE_JWT_SECRET || "fallback-secret-for-lab";

export interface LabSession {
  memberId: string;
  teamId: string;
  role: string;
}

export async function getTeamByReadableId(readableId: string) {
  const supabase = await createClient();
  
  // Find the team by its human-readable ID (6-digit numeric)
  const { data: team, error } = await supabase
    .from("hf_teams")
    .select("id, name, readable_id")
    .eq("readable_id", readableId.toUpperCase())
    .single();

  if (error || !team) return { success: false, error: "INVALID_TEAM_ID: Node not found in registry." };

  // Fetch the roster for this team, including participant link for name fallback
  const { data: members } = await supabase
    .from("hf_team_members")
    .select("id, role, user_id, name, participant_id")
    .eq("team_id", team.id);

  // If any member has a null name, attempt to resolve it from hf_participants
  const resolvedMembers = await Promise.all(
    (members || []).map(async (m) => {
      if (m.name) return m;
      if (m.participant_id) {
        const { data: participant } = await supabase
          .from("hf_participants")
          .select("full_name")
          .eq("id", m.participant_id)
          .single();
        return { ...m, name: participant?.full_name || null };
      }
      return m;
    })
  );

  return { success: true, team, members: resolvedMembers };
}

export async function verifyMemberAccess(memberId: string, pin: string) {
  // --- Rate limiting (per IP) for lab login ---
  let ip = 'unknown';
  try {
    const { headers } = await import('next/headers');
    const hdrs = await headers();
    ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  } catch (e) {
    // Fall back gracefully if headers unavailable
  }
  if (!(globalThis as any).__labLoginRateStore) (globalThis as any).__labLoginRateStore = new Map();
  const store = (globalThis as any).__labLoginRateStore as Map<string, { count: number; reset: number }>;
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const limit = 20; // allow up to 20 attempts per minute per IP
  const entry = store.get(ip) || { count: 0, reset: now + windowMs };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowMs;
  }
  entry.count += 1;
  store.set(ip, entry);
  if (entry.count > limit) {
    console.warn(`[LAB_AUTH] Rate limit exceeded for IP ${ip}`);
    return { success: false, error: 'RATE_LIMIT_EXCEEDED: Too many login attempts, please try again later.' };
  }

  const supabase = await createClient();

  const { data: member, error } = await supabase
    .from("hf_team_members")
    .select("hashed_pin, team_id, role")
    .eq("id", memberId)
    .single();

  if (error || !member) return { success: false, error: "ACCESS_DENIED: Member record corrupted." };

  // Compare entered PIN with hashed value in DB
  const isValid = await bcrypt.compare(pin, member.hashed_pin);

  if (isValid) {
    // 1. Get the Team's Event ID to check the timer
    const { data: team } = await supabase
      .from("hf_teams")
      .select("event_id")
      .eq("id", member.team_id)
      .single();

    // 2. Traffic Controller: Check Event Status
    let destinationRoute = "/lab/dashboard/terminal"; // Default to terminal
    
    if (team?.event_id) {
      const { data: event } = await supabase
        .from("hf_events")
        .select("start_time, end_time, is_active")
        .eq("id", team.event_id)
        .single();

      const now = new Date();
      const startTime = event?.start_time ? new Date(event.start_time) : now;
      const endTime = event?.end_time ? new Date(event.end_time) : new Date(now.getTime() + 86400000);
      
      // Strict window: Must be active AND between start and end times
      if (!event?.is_active || now < startTime || now > endTime) {
        destinationRoute = "/lab/lobby";
      }
    }

    // Set a SECURE JWT cookie for the lab session
    const payload: LabSession = {
      memberId,
      teamId: member.team_id,
      role: member.role
    };

    const token = jwt.sign(payload, LAB_SESSION_SECRET, { expiresIn: "24h" });

    const cookieStore = await cookies();
    cookieStore.set("lab_session", token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 60 * 60 * 24 
    }); 

    return { success: true, route: destinationRoute };
  }

  return { success: false, error: "INVALID_PIN: Authentication failed." };
}

export async function getEventDetailsForSession() {
  const session = await getLabSession();
  if (!session?.teamId) return null;

  const supabase = await createClient();

  // 1. Get the Event ID from the team
  const { data: team } = await supabase
    .from("hf_teams")
    .select("event_id")
    .eq("id", session.teamId)
    .single();

  if (!team?.event_id) return null;

  // 2. Fetch the Event details
  const { data: event } = await supabase
    .from("hf_events")
    .select("*")
    .eq("id", team.event_id)
    .single();

  return event;
}

export async function getLabSession(): Promise<LabSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("lab_session");
  
  if (!sessionCookie) return null;
  
  try {
    const decoded = jwt.verify(sessionCookie.value, LAB_SESSION_SECRET) as LabSession;
    return decoded;
  } catch (err) {
    console.error("[AUTH] Lab session verification failed:", err instanceof Error ? err.message : "Unknown error");
    return null;
  }
}

export async function destroyLabSession() {
  const cookieStore = await cookies();
  cookieStore.delete("lab_session");
}