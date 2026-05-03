'use server'

import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

/**
 * PHASE 1: Create the Event Node
 * Only accepts Max Size now.
 */
export async function createEventAction(
  name: string, 
  pin: string,
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
      event_name: name,
      event_pin: pin,
      organiser_id: session.user.id,
      is_active: true,
      max_team_size: maxSize, 
      column_mapping: {} 
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/dashboard"); 
  return { success: true, event: data };
}

export async function updateEventMapping(eventId: string, mapping: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('hf_events').update({ column_mapping: mapping }).eq('id', eventId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateEventSettingsAction(
  eventId: string, 
  settings: {
    start_time: string;
    primary_repo_url: string;
    gateway_endpoint_url: string;
    max_team_size: number; 
  }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hf_events")
    .update({
      start_time: settings.start_time,
      primary_repo_url: settings.primary_repo_url,
      gateway_endpoint_url: settings.gateway_endpoint_url,
      max_team_size: settings.max_team_size,
    })
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}