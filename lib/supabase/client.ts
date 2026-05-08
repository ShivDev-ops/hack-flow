// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null;

// Use "export function" (named export) so { createClient } works
export function createClient() {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return supabaseInstance;
}