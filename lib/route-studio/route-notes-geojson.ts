import type { NavRideCue, NavRideCueSeverity } from "./navride-route/types.ts";
import {
  flattenRouteLngLats,
  lngLatAtProgressM,
  NOTE_OFF_TRACK_METERS,
  progressMNearestOnPolyline,
  type LngLat,
} from "./geo.ts";

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
      progressM: number | null;
      noteStatus: string;
    };
    geometry: { type: "Point"; coordinates: LngLat };
  }>;
};

/**
 * Marker position = cue.lat/lon when set (user click authority).
 * Fallback: project progressM onto track (legacy cues without lat/lon).
 */
export function buildRouteNotesGeoJSON(
  cues: NavRideCue[],
  segs: RouteNotesSegment[],
): RouteNotesFeatureCollection {
  const line = flattenRouteLngLats(segs);
  const features: RouteNotesFeatureCollection["features"] = [];
  for (const c of cues) {
    let ll: LngLat | null = null;
    if (
      typeof c.lat === "number" &&
      typeof c.lon === "number" &&
      Number.isFinite(c.lat) &&
      Number.isFinite(c.lon)
    ) {
      ll = [c.lon, c.lat];
    } else if (c.progressM != null && Number.isFinite(c.progressM)) {
      ll = lngLatAtProgressM(line, c.progressM);
    }
    if (!ll) continue;
    features.push({
      type: "Feature",
      properties: {
        id: c.cueId,
        severity: c.severity,
        text: c.message,
        title: c.title,
        progressM: c.progressM,
        noteStatus: c.noteStatus ?? "on_track",
      },
      geometry: { type: "Point", coordinates: ll },
    });
  }
  return { type: "FeatureCollection", features };
}

/** Reproject notes onto new track geometry; preserve lat/lon. */
export function reprojectCuesOnTrack(
  cues: NavRideCue[],
  segs: RouteNotesSegment[],
  offTrackM = NOTE_OFF_TRACK_METERS,
): NavRideCue[] {
  const line = flattenRouteLngLats(segs);
  return cues.map((c) => {
    if (
      typeof c.lat !== "number" ||
      typeof c.lon !== "number" ||
      !Number.isFinite(c.lat) ||
      !Number.isFinite(c.lon)
    ) {
      return c;
    }
    const hit = progressMNearestOnPolyline(line, [c.lon, c.lat]);
    if (!hit || hit.distanceToTrackM > offTrackM) {
      return {
        ...c,
        progressM: null,
        noteStatus: "off_track" as const,
        nearestSegmentIndex: hit?.segmentIndex ?? null,
        projectionFraction: hit?.fraction ?? null,
      };
    }
    return {
      ...c,
      progressM: hit.progressM,
      noteStatus: "on_track" as const,
      nearestSegmentIndex: hit.segmentIndex,
      projectionFraction: hit.fraction,
    };
  });
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
