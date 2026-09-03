import type { NavRideCue, NavRideCueSeverity } from "./navride-route/types.ts";
import { flattenRouteLngLats, lngLatAtProgressM, type LngLat } from "./geo.ts";

export const SRC_ROUTE_NOTES = "route-notes-source";
export const LYR_ROUTE_NOTES = "route-notes-layer";
export const LYR_ROUTE_NOTES_HALO = "route-notes-halo-layer";

/** Visual colors for cue severity (editor + nav parity). */
export const CUE_SEVERITY_COLORS: Record<NavRideCueSeverity, string> = {
  info: "#22C55E",
  attention: "#EAB308",
  caution: "#F97316",
  danger: "#EF4444",
};

export type RouteNotesSegment = {
  routePoints: LngLat[];
  waypoints: LngLat[];
  routingFailed?: boolean;
};

export type RouteNotesFeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: {
      id: string;
      severity: NavRideCueSeverity;
      text: string;
      title: string;
      progressM: number;
    };
    geometry: { type: "Point"; coordinates: LngLat };
  }>;
};

export function buildRouteNotesGeoJSON(
  cues: NavRideCue[],
  segs: RouteNotesSegment[],
): RouteNotesFeatureCollection {
  const line = flattenRouteLngLats(segs);
  const features: RouteNotesFeatureCollection["features"] = [];
  for (const c of cues) {
    const ll = lngLatAtProgressM(line, c.progressM);
    if (!ll) continue;
    features.push({
      type: "Feature",
      properties: {
        id: c.cueId,
        severity: c.severity,
        text: c.message,
        title: c.title,
        progressM: c.progressM,
      },
      geometry: { type: "Point", coordinates: ll },
    });
  }
  return { type: "FeatureCollection", features };
}

/** MapLibre data-driven paint for note circles (~14–18 px diameter). */
export const routeNotesCirclePaint = {
  "circle-radius": [
    "match",
    ["get", "severity"],
    "danger",
    8,
    "caution",
    7.5,
    "attention",
    7,
    6.5,
  ],
  "circle-color": [
    "match",
    ["get", "severity"],
    "danger",
    CUE_SEVERITY_COLORS.danger,
    "caution",
    CUE_SEVERITY_COLORS.caution,
    "attention",
    CUE_SEVERITY_COLORS.attention,
    CUE_SEVERITY_COLORS.info,
  ],
  "circle-stroke-width": 1.5,
  "circle-stroke-color": "#0a0a0a",
  "circle-opacity": 0.95,
} as const;
