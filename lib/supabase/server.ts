import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createServerSupabaseClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase no está configurado en el servidor");

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
      ) =>
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options),
        ),
    },
  });
};
