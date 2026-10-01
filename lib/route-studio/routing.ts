import { haversineKm } from "./geo";
import type { RouteSegmentMode } from "./segment-routing-mode";

export type LngLat = [number, number];
export type TransportMode = "walk" | "bike" | "moto" | "car";

const OSRM_BASE_URL = "https://router.project-osrm.org";

export function osrmProfileForSegment(
  transport: TransportMode,
  segmentMode: RouteSegmentMode = "FOLLOW_ROAD",
): string {
  if (segmentMode === "MANUAL_STRAIGHT") return "none";
  if (segmentMode === "FOLLOW_TRAIL") return "none";
  return transport === "car" || transport === "moto" ? "driving" : "none";
}

export const TRANSPORT_MODES: {
  id: TransportMode;
  label: string;
  osrmProfile: string;
  description: string;
}[] = [
  { id: "walk", label: "Caminar", osrmProfile: "none", description: "Valhalla pedestrian sobre caminos y senderos OSM." },
  { id: "bike", label: "Bici", osrmProfile: "none", description: "Valhalla bicycle; perfil mountain en Seguir caminos." },
  { id: "moto", label: "Moto", osrmProfile: "driving", description: "Valhalla motorcycle con soporte de trails; OSRM driving solo fallback de carretera." },
  { id: "car", label: "Coche", osrmProfile: "driving", description: "Valhalla auto; OSRM driving como fallback de carretera." },
];

export type RouteFailureReason = "no_route" | "network" | "timeout" | "disconnected" | "mode_unreachable";
export type RouteResult = {
  points: LngLat[];
  ok: boolean;
  profile: string;
  reason?: RouteFailureReason;
  message?: string;
};

async function requestValhallaRoute(
  waypoints: LngLat[],
  mode: TransportMode,
  segmentMode: RouteSegmentMode,
): Promise<RouteResult> {
  try {
    const res = await fetch("/api/gpx-routing", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ waypoints, mode, segmentMode }),
      signal: AbortSignal.timeout(11000),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.ok && Array.isArray(data.points) && data.points.length >= 2) {
      return {
        points: data.points as LngLat[],
        ok: true,
        profile: `valhalla:${data.profile ?? mode}`,
      };
    }
    return {
      points: [],
      ok: false,
      profile: `valhalla:${mode}`,
      reason: res.status >= 500 ? "network" : "no_route",
      message: data?.message ?? `Valhalla respondió ${res.status}`,
    };
  } catch {
    return {
      points: [],
      ok: false,
      profile: `valhalla:${mode}`,
      reason: "timeout",
      message: "Valhalla no respondió a tiempo.",
    };
  }
}

async function requestOsrmRoadFallback(
  waypoints: LngLat[],
  mode: TransportMode,
  segmentMode: RouteSegmentMode,
): Promise<RouteResult> {
  const profile = osrmProfileForSegment(mode, segmentMode);
  if (profile === "none") {
    return {
      points: [],
      ok: false,
      profile: "none",
      reason: "mode_unreachable",
      message: "Sin fallback OSRM válido para este modo.",
    };
  }

  const coords = waypoints
    .map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`)
    .join(";");
  try {
    const res = await fetch(
      `${OSRM_BASE_URL}/route/v1/${profile}/${coords}?overview=full&geometries=geojson&steps=false`,
      { signal: AbortSignal.timeout(7000) },
    );
    if (!res.ok) {
      return { points: [], ok: false, profile, reason: "network", message: `OSRM respondió ${res.status}` };
    }
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates?.length > 0) {
      return { points: data.routes[0].geometry.coordinates as LngLat[], ok: true, profile: `osrm:${profile}` };
    }
    return {
      points: [],
      ok: false,
      profile,
      reason: "no_route",
      message: data.message ?? "OSRM no encontró ruta.",
    };
  } catch {
    return { points: [], ok: false, profile, reason: "timeout", message: "OSRM no respondió a tiempo." };
  }
}

function pushDistinct(out: LngLat[], point: LngLat) {
  const last = out[out.length - 1];
  if (!last || haversineKm(last, point) * 1000 > 0.5) out.push(point);
}

/**
 * Router fuerte del editor:
 * 1) Valhalla/OSM multimodo para carreteras, pistas, caminos y senderos.
 * 2) OSRM público únicamente como fallback de carretera para coche/moto.
 * 3) Nunca dibuja una recta como si fuera routing correcto.
 */
export async function routeWaypoints(
  waypoints: LngLat[],
  mode: TransportMode,
  segmentMode: RouteSegmentMode = "FOLLOW_ROAD",
): Promise<RouteResult> {
  if (waypoints.length < 2) return { points: waypoints, ok: true, profile: "none" };
  if (segmentMode === "MANUAL_STRAIGHT") {
    return { points: [...waypoints], ok: true, profile: "manual_straight" };
  }

  const output: LngLat[] = [];
  pushDistinct(output, waypoints[0]);

  for (let i = 1; i < waypoints.length; i++) {
    const endpoints: LngLat[] = [waypoints[i - 1], waypoints[i]];
    let leg = await requestValhallaRoute(endpoints, mode, segmentMode);

    if (!leg.ok && segmentMode === "FOLLOW_ROAD" && (mode === "car" || mode === "moto")) {
      leg = await requestOsrmRoadFallback(endpoints, mode, segmentMode);
    }

    if (!leg.ok) return { ...leg, points: output };
    for (const point of leg.points) pushDistinct(output, point);
    pushDistinct(output, waypoints[i]);
  }

  return {
    points: output,
    ok: true,
    profile: `valhalla:${mode}:${segmentMode.toLowerCase()}`,
  };
}

export async function snapClickToRoute(
  click: LngLat,
  prev: LngLat | null,
  mode: TransportMode,
  _maxSnapM = 25,
  segmentMode: RouteSegmentMode = "FOLLOW_ROAD",
): Promise<{ snapped: LngLat; routeSegment: LngLat[] | null; rejectedFar: boolean }> {
  if (!prev || segmentMode === "MANUAL_STRAIGHT") {
    return { snapped: click, routeSegment: null, rejectedFar: false };
  }
  const preview = await routeWaypoints([prev, click], mode, segmentMode);
  return {
    snapped: click,
    routeSegment: preview.ok ? preview.points : null,
    rejectedFar: false,
  };
}

export function detectAbsurdDetour(waypoints: LngLat[], route: LngLat[]): boolean {
  if (waypoints.length < 2 || route.length < 2) return false;
  const direct = haversineKm(waypoints[0], waypoints[waypoints.length - 1]);
  let routeLen = 0;
  for (let i = 1; i < route.length; i++) routeLen += haversineKm(route[i - 1], route[i]);
  if (direct < 0.05) return false;
  return routeLen > direct * 4 && direct < 2;
}
