import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("username, avatar_url, show_username_on_reports, display_name, role, points, total_alerts")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  let body: { username?: string; show_username_on_reports?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.username === "string") {
    const trimmed = body.username.trim().slice(0, 32);
    update.username = trimmed || null;
  }
  if (typeof body.show_username_on_reports === "boolean") {
    update.show_username_on_reports = body.show_username_on_reports;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: false, error: "Sin campos para actualizar" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("id", user.id)
    .select("username, avatar_url, show_username_on_reports")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: data });
}
