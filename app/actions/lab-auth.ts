"use server";

import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function getTeamByReadableId(readableId: string) {
  const supabase = await createClient();
  
  // Find the team by its human-readable ID (e.g., TEAM-XXXX)
  const { data: team, error } = await supabase
    .from("hf_teams")
    .select("id, name, readable_id")
    .eq("readable_id", readableId.toUpperCase())
    .single();

  if (error || !team) return { success: false, error: "INVALID_TEAM_ID: Node not found in registry." };

  // Fetch the roster for this team
  const { data: members, error: memberError } = await supabase
    .from("hf_team_members")
    .select("id, role, user_id")
    .eq("team_id", team.id);

  return { success: true, team, members: members || [] };
}

export async function verifyMemberAccess(memberId: string, pin: string) {
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

    // 2. Traffic Controller: Check Event Start Time
    let destinationRoute = "/lab/terminal"; // Default to terminal
    
    if (team?.event_id) {
      const { data: event } = await supabase
        .from("hf_events")
        .select("start_time")
        .eq("id", team.event_id)
        .single();

      // If the event hasn't started yet, route them to the Lobby instead
      if (event && new Date() < new Date(event.start_time)) {
        destinationRoute = "/lab/lobby";
      }
    }

    // Set an HTTP-only cookie for the lab session
    const cookieStore = await cookies();
    cookieStore.set("lab_session", JSON.stringify({
      memberId,
      teamId: member.team_id,
      role: member.role
    }), { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      maxAge: 60 * 60 * 24 
    }); 

    return { success: true, route: destinationRoute };
  }

  return { success: false, error: "INVALID_PIN: Authentication failed." };
}

export async function getLabSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("lab_session");
  
  if (!sessionCookie) return null;
  
  try {
    return JSON.parse(sessionCookie.value);
  } catch (error) {
    return null;
  }
}