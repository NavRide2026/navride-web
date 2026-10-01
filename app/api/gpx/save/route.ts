import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { saveOrUpdateRouteToCloud, type SaveRouteInput } from "@/lib/gpx/saveRouteToCloud";

export const dynamic = "force-dynamic";
const MAX_GPX_BYTES = 20 * 1024 * 1024;
const MAX_POINTS = 200_000;
type Body = SaveRouteInput & { existingRouteId?: string | null };

export async function POST(request: Request) {
  const declaredSize = Number(request.headers.get("content-length") ?? 0);
  if (declaredSize > MAX_GPX_BYTES) return NextResponse.json({ ok: false, error: "El archivo GPX supera el límite permitido." }, { status: 413 });

  let serverSupabase;
  try { serverSupabase = await createServerSupabaseClient(); }
  catch { return NextResponse.json({ ok: false, error: "Servicio temporalmente no disponible." }, { status: 503 }); }

  const { data: { user }, error: authErr } = await serverSupabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ ok: false, error: "Necesitas iniciar sesión para guardar rutas." }, { status: 401 });

  let body: Body;
  try { body = (await request.json()) as Body; }
  catch { return NextResponse.json({ ok: false, error: "Petición inválida." }, { status: 400 }); }

  const title = String(body.title ?? "Mi ruta NavRide").trim().slice(0, 100);
  const gpxXml = String(body.gpxXml ?? "");
  const encodedSize = new TextEncoder().encode(gpxXml).byteLength;
  const waypointsCount = Number(body.waypointsCount ?? 0);
  const distanceM = Number(body.distanceM ?? 0);

  if (!gpxXml.trim()) return NextResponse.json({ ok: false, error: "El GPX está vacío." }, { status: 400 });
  if (encodedSize > MAX_GPX_BYTES) return NextResponse.json({ ok: false, error: "El archivo GPX supera el límite permitido." }, { status: 413 });
  if (!gpxXml.includes("<gpx") || !gpxXml.includes("</gpx>")) return NextResponse.json({ ok: false, error: "El contenido no parece un archivo GPX válido." }, { status: 400 });
  if (!Number.isFinite(waypointsCount) || waypointsCount < 0 || waypointsCount > MAX_POINTS) return NextResponse.json({ ok: false, error: "La ruta contiene demasiados puntos." }, { status: 400 });
  if (!Number.isFinite(distanceM) || distanceM < 0) return NextResponse.json({ ok: false, error: "La distancia de la ruta no es válida." }, { status: 400 });

  const input: SaveRouteInput = { title: title || "Mi ruta NavRide", gpxXml, waypointsCount, distanceM };
  const result = await saveOrUpdateRouteToCloud(serverSupabase, user, input, body.existingRouteId ?? null);
  if (!result.ok) return NextResponse.json({ ok: false, error: "No se pudo guardar la ruta. Inténtalo de nuevo." }, { status: 500 });
  return NextResponse.json(result);
}
