import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-side Supabase client (anon key). Returns null when unconfigured so
// the app runs on the built-in verified seed without Supabase.
export function createBrowserClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: true } });
}

export const isSupabaseConfigured = (): boolean =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
