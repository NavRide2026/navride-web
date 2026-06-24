import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  saveOrUpdateRouteToCloud,
  type SaveRouteInput,
} from "@/lib/gpx/saveRouteToCloud";

export const dynamic = "force-dynamic";

type Body = SaveRouteInput & { existingRouteId?: string | null };

export async function POST(request: Request) {
  const serverSupabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authErr,
  } = await serverSupabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json(
      { ok: false, error: "Necesitas iniciar sesión para guardar rutas." },
      { status: 401 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Petición inválida." },
      { status: 400 },
    );
  }

  const input: SaveRouteInput = {
    title: body.title ?? "Mi ruta NavRide",
    gpxXml: body.gpxXml ?? "",
    waypointsCount: body.waypointsCount ?? 0,
    distanceM: body.distanceM ?? 0,
  };

  if (!input.gpxXml.trim()) {
    return NextResponse.json(
      { ok: false, error: "El GPX está vacío." },
      { status: 400 },
    );
  }

  // Sesión validada en servidor; admin opcional si RLS storage aún no está aplicado.
  const admin = createAdminSupabaseClient();
  const supabase = admin ?? serverSupabase;

  const result = await saveOrUpdateRouteToCloud(
    supabase,
    user,
    input,
    body.existingRouteId ?? null,
  );

  if (!result.ok) {
    const isRls =
      result.error.includes("row-level security") ||
      result.error.includes("RLS");
    const hint = isRls
      ? " Ejecuta supabase/fix_gpx_storage_upload_rls.sql en el SQL Editor de Supabase."
      : "";
    return NextResponse.json(
      { ok: false, error: result.error + hint },
      { status: isRls ? 403 : 500 },
    );
  }

  return NextResponse.json(result);
}
