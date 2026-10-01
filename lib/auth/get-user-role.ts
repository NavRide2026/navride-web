import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserRole(
  supabase: SupabaseClient,
): Promise<"user" | "admin" | "police" | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error) return null;
    return (data?.role as "user" | "admin" | "police") ?? null;
  } catch {
    return null;
  }
}
