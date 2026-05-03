// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

// Use "export function" (named export) so { createClient } works
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}