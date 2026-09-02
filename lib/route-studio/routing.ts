import { haversineKm } from "./geo";

export type LngLat = [number, number];

export type TransportMode = "walk" | "bike" | "moto" | "car";

export const TRANSPORT_MODES: {
  id: TransportMode;
  label: string;
  osrmProfile: string;
  description: string;
}[] = [
  {
    id: "walk",
    label: "Caminar",
    osrmProfile: "foot",
    description: "Senderos y zonas peatonales cuando OSRM las conoce.",
  },
  {
    id: "bike",
    label: "Bici",
    osrmProfile: "bike",
    description: "Ciclovías y carreteras accesibles en bici.",
  },
  {
    id: "moto",
    label: "Moto",
    osrmProfile: "driving",
    description:
      "Usa perfil OSRM driving (mismo que coche por ahora; modo separado para futuro).",
  },
  {
    id: "car",
    label: "Coche",
    osrmProfile: "driving",
    description: "Red viaria motorizada (perfil OSRM driving).",
  },
];

export type RouteFailureReason =
  | "no_route"
  | "network"
  | "timeout"
  | "disconnected"
  | "mode_unreachable";

export type RouteResult = {
  points: LngLat[];
  ok: boolean;
  profile: string;
  reason?: RouteFailureReason;
  message?: string;
};

export async function routeWaypoints(
  waypoints: LngLat[],
  mode: TransportMode,
): Promise<RouteResult> {
  if (waypoints.length < 2) {
    return { points: waypoints, ok: true, profile: "none" };
  }

  const modeDef = TRANSPORT_MODES.find((m) => m.id === mode)!;
  const coords = waypoints
    .map(([lng, lat]) => `${lng.toFixed(6)},${lat.toFixed(6)}`)
    .join(";");

  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/${modeDef.osrmProfile}/${coords}?overview=full&geometries=geojson&steps=false`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) {
      return {
        points: waypoints,
        ok: false,
        profile: modeDef.osrmProfile,
        reason: "network",
        message: `OSRM respondió ${res.status}`,
      };
    }
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]?.geometry?.coordinates?.length > 0) {
      const pts = data.routes[0].geometry.coordinates as LngLat[];
      return { points: pts, ok: true, profile: modeDef.osrmProfile };
    }
    if (data.code === "NoRoute" || data.code === "NoSegment") {
      return {
        points: waypoints,
        ok: false,
        profile: modeDef.osrmProfile,
        reason: "mode_unreachable",
        message: `Punto inalcanzable en modo ${modeDef.label}: no hay ruta OSRM hasta ahí.`,
      };
    }
    return {
      points: waypoints,
      ok: false,
      profile: modeDef.osrmProfile,
      reason: "no_route",
      message: data.message ?? "No se pudo calcular la ruta.",
    };
  } catch {
    return {
      points: waypoints,
      ok: false,
      profile: modeDef.osrmProfile,
      reason: "timeout",
      message: "Tiempo de espera agotado al calcular la ruta.",
    };
  }
}

/** Snap suave: usa el primer punto de ruta OSRM entre origen y destino cercano. */
export async function snapClickToRoute(
  click: LngLat,
  prev: LngLat | null,
  mode: TransportMode,
): Promise<{ snapped: LngLat; routeSegment: LngLat[] | null }> {
  if (!prev) return { snapped: click, routeSegment: null };
  const result = await routeWaypoints([prev, click], mode);
  if (!result.ok || result.points.length < 2) {
    return { snapped: click, routeSegment: null };
  }
  const last = result.points[result.points.length - 1];
  return { snapped: last, routeSegment: result.points };
}

export function detectAbsurdDetour(
  waypoints: LngLat[],
  route: LngLat[],
): boolean {
  if (waypoints.length < 2 || route.length < 2) return false;
  const direct = haversineKm(waypoints[0], waypoints[waypoints.length - 1]);
  let routeLen = 0;
  for (let i = 1; i < route.length; i++) {
    routeLen += haversineKm(route[i - 1], route[i]);
  }
  if (direct < 0.05) return false;
  return routeLen > direct * 4 && direct < 2;
}
