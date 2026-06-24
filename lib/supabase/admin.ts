import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Cliente admin (solo servidor). Omite RLS — usar solo tras validar sesión del usuario. */
export function createAdminSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
