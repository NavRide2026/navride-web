import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const serverClient = await createServerSupabaseClient();
  const { data: { user }, error: authErr } = await serverClient.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: "Inicia sesión para votar" }, { status: 401 });
  }

  let body: { voto: "up" | "down" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 400 });
  }

  if (body.voto !== "up" && body.voto !== "down") {
    return NextResponse.json({ ok: false, error: "voto debe ser 'up' o 'down'" }, { status: 400 });
  }

  // 1. Registrar o actualizar el voto del usuario (deduplicado por alerta_id + user_id)
  const { error: voteErr } = await serverClient.from("alerta_votos").upsert(
    { alerta_id: id, user_id: user.id, voto: body.voto },
    { onConflict: "alerta_id,user_id" },
  );

  if (voteErr) {
    return NextResponse.json({ ok: false, error: voteErr.message }, { status: 500 });
  }

  // 2. Reconteo con cliente admin para saltar RLS en alerta_votos (read own)
  const admin = createAdminSupabaseClient();
  const countClient = admin ?? serverClient;

  const [{ count: upCount }, { count: downCount }] = await Promise.all([
    countClient.from("alerta_votos").select("*", { count: "exact", head: true })
      .eq("alerta_id", id).eq("voto", "up"),
    countClient.from("alerta_votos").select("*", { count: "exact", head: true })
      .eq("alerta_id", id).eq("voto", "down"),
  ]);

  const votes_up   = upCount   ?? 0;
  const votes_down = downCount ?? 0;

  // 3. Actualizar route_alerts (el trigger votes_auto_expire maneja is_active cuando votes_down >= 3)
  const alertUpdate: Record<string, unknown> = { votes_up, votes_down };

  const { data: updated, error: updateErr } = await countClient
    .from("route_alerts")
    .update(alertUpdate)
    .eq("id", id)
    .select("id, is_active, votes_up, votes_down, alert_type, alert_category, location_name, created_at, latitude, longitude")
    .maybeSingle();

  if (updateErr) {
    return NextResponse.json({ ok: false, error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, alert: updated });
}
