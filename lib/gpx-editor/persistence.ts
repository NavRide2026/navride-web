import { createClient } from "@/lib/supabase/client";
import { saveOrUpdateRouteToCloud } from "@/lib/gpx/saveRouteToCloud";
import type { NavRideCue } from "@/lib/route-studio/navride-route/types";
import type { RouteCapsule } from "@/lib/route-studio/navride-route/gpx-codec";
import type { Segment } from "./editor-types";
import { exportGpx } from "./export-gpx";

function segmentKm(points: [number, number][]): number {
  const earthKm = 6371;
  let distance = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    const dLat = ((b[1] - a[1]) * Math.PI) / 180;
    const dLon = ((b[0] - a[0]) * Math.PI) / 180;
    const latA = (a[1] * Math.PI) / 180;
    const latB = (b[1] * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(latA) *
        Math.cos(latB) *
        Math.sin(dLon / 2) ** 2;
    distance += earthKm * 2 * Math.asin(Math.sqrt(h));
  }
  return distance;
}

export function routeSignature(
  segments: Segment[],
  title: string,
): string {
  const points = segments.flatMap((segment) =>
    segment.routePoints.length >= 2 && !segment.routingFailed
      ? segment.routePoints
      : [],
  );
  const km = segments.reduce(
    (sum, segment) =>
      sum +
      segmentKm(
        segment.routePoints.length >= 2
          ? segment.routePoints
          : segment.waypoints,
      ),
    0,
  );
  return `${title}|${points.length}|${km.toFixed(3)}`;
}

export type PersistRouteResult =
  | { ok: true; routeId: string; signature: string }
  | { ok: false; error: string };

export async function persistRouteToCloud({
  segments,
  title,
  cues,
  capsule,
  savedRouteId,
}: {
  segments: Segment[];
  title: string;
  cues: NavRideCue[];
  capsule: RouteCapsule | null;
  savedRouteId: string | null;
}): Promise<PersistRouteResult> {
  const points = segments.flatMap((segment) =>
    segment.routePoints.length >= 2 && !segment.routingFailed
      ? segment.routePoints
      : [],
  );
  if (points.length < 2) {
    return {
      ok: false,
      error:
        "No hay geometría enrutada válida para guardar (evita líneas rectas fallidas).",
    };
  }

  const gpxXml = exportGpx(segments, title, cues, capsule);
  const supabase = createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      ok: false,
      error: "Necesitas iniciar sesión para guardar rutas.",
    };
  }

  const distanceKm = segments.reduce(
    (sum, segment) =>
      sum +
      segmentKm(
        segment.routePoints.length >= 2
          ? segment.routePoints
          : segment.waypoints,
      ),
    0,
  );
  const result = await saveOrUpdateRouteToCloud(
    supabase,
    user,
    {
      title,
      gpxXml,
      waypointsCount: points.length,
      distanceM: distanceKm * 1000,
    },
    savedRouteId,
  );
  if (!result.ok) return { ok: false, error: result.error };
  return {
    ok: true,
    routeId: result.routeId,
    signature: routeSignature(segments, title),
  };
}
