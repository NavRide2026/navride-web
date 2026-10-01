import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Permite que la web pública y el editor funcionen localmente sin Supabase. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const createClient = () =>
  createBrowserClient(
    supabaseUrl ?? "https://local-placeholder.supabase.co",
    supabaseKey ?? "local-placeholder-public-anon-key",
  );
