'use server'

import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

/**
 * PHASE 1: Create the Event Node
 * Signature updated to accept 3 arguments to fix the TS(2554) error.
 * The pin argument is accepted but ignored as per the new relational schema.
 */
export async function createEventAction(
  name: string, 
  pin: string, // Kept to satisfy your frontend caller, but unused in new schema
  maxSize: number = 4
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED: Please log in to initialize a node." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('hf_events')
    .insert({
      name: name,
      start_time: new Date().toISOString(),
      // Defaulting end_time to 48 hours from now to satisfy the RLS deadline lock
      end_time: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      max_members: maxSize,
      column_mapping: {} 
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/dashboard"); 
  return { success: true, event: data };
}

/**
 * PHASE 2: Update Settings
 * Fixed TS(2345) by making end_time optional or providing a fallback.
 */
export async function updateEventSettingsAction(
  eventId: string, 
  settings: {
    start_time: string;
    end_time?: string; // Made optional to satisfy your formData object
    max_team_size: number; 
    primary_repo_url?: string;
    gateway_endpoint_url?: string;
  }
) {
  const supabase = await createClient();
  
  // Ensure we have an end_time (fallback to +48h if missing)
  const finalEndTime = settings.end_time || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("hf_events")
    .update({
      start_time: settings.start_time,
      end_time: finalEndTime,
      max_members: settings.max_team_size,
    })
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEventMapping(eventId: string, mapping: any) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('hf_events')
    .update({ column_mapping: mapping })
    .eq('id', eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}