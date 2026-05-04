'use server'

import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

/**
 * PHASE 1: Create the Event Node
 * Updated to remove pin and include optional startTime and endTime.
 */
export async function createEventAction(
  name: string, 
  maxSize: number = 4,
  startTime?: string,
  endTime?: string
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return { success: false, error: "UNAUTHORIZED: Please log in to initialize a node." };
  }

  const supabase = await createClient();

  // Defaults
  const finalStartTime = startTime || new Date().toISOString();
  const finalEndTime = endTime || new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('hf_events')
    .insert({
      name: name,
      start_time: finalStartTime,
      end_time: finalEndTime,
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
 */
export async function updateEventSettingsAction(
  eventId: string, 
  settings: {
    start_time: string;
    end_time: string;
    max_team_size: number; 
    primary_repo_url?: string;
    gateway_endpoint_url?: string;
  }
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("hf_events")
    .update({
      start_time: settings.start_time,
      end_time: settings.end_time,
      max_members: settings.max_team_size,
      primary_repo_url: settings.primary_repo_url,
      gateway_endpoint_url: settings.gateway_endpoint_url
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