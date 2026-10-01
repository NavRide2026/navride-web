import type { LngLat, Segment } from "@/lib/gpx-editor/editor-types";
import { haversineKm } from "@/lib/route-studio/geo";

export type SurfaceBucket =
  | "asphalt"
  | "gravel"
  | "dirt"
  | "track"
  | "path"
  | "road"
  | "unknown";

export type RouteAnalysis = {
  distanceKm: number;
  etaMinutes: number;
  elevGainM: number | null;
  elevLossM: number | null;
  elevMinM: number | null;
  elevMaxM: number | null;
  avgGradePct: number | null;
  surfaces: Record<SurfaceBucket, number>;
};

function lineOf(seg: Segment): LngLat[] {
  if (seg.routePoints.length >= 2) return seg.routePoints;
  return seg.waypoints;
}

function distanceKm(pts: LngLat[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
  return d;
}

/** Rough ETA by transport: walk 4.5 km/h, bike 18, moto 55, car 70. */
export function estimateEtaMinutes(
  km: number,
  mode: "walk" | "bike" | "moto" | "car",
): number {
  const speed = { walk: 4.5, bike: 18, moto: 55, car: 70 }[mode];
  return Math.round((km / speed) * 60);
}

function classifyPathKind(seg: Segment): SurfaceBucket {
  const mode = seg.routeSegmentMode;
  if (mode === "FOLLOW_TRAIL") return "path";
  if (mode === "MANUAL_STRAIGHT") return "unknown";
  if (mode === "FOLLOW_ROAD") return "road";
  if (seg.pathKind === "track") return "track";
  if (seg.pathKind === "freehand") return "unknown";
  return "road";
}

/**
 * Analysis without DEM: distance + ETA always; elevation null unless
 * waypoints carry ele via parallel array (optional elevationsM).
 */
export function analyzeRouteMetrics(
  segments: Segment[],
  mode: "walk" | "bike" | "moto" | "car",
  elevationsM?: (number | null)[],
): RouteAnalysis {
  const surfaces: Record<SurfaceBucket, number> = {
    asphalt: 0,
    gravel: 0,
    dirt: 0,
    track: 0,
    path: 0,
    road: 0,
    unknown: 0,
  };

  let distanceKmTotal = 0;
  for (const seg of segments) {
    const pts = lineOf(seg);
    const km = distanceKm(pts);
    distanceKmTotal += km;
    surfaces[classifyPathKind(seg)] += km;
  }

  let elevGainM: number | null = null;
  let elevLossM: number | null = null;
  let elevMinM: number | null = null;
  let elevMaxM: number | null = null;
  let avgGradePct: number | null = null;

  if (elevationsM && elevationsM.length >= 2) {
    let gain = 0;
    let loss = 0;
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let valid = 0;
    for (let i = 0; i < elevationsM.length; i++) {
      const e = elevationsM[i];
      if (e == null || !Number.isFinite(e)) continue;
      valid += 1;
      min = Math.min(min, e);
      max = Math.max(max, e);
      if (i > 0) {
        const prev = elevationsM[i - 1];
        if (prev != null && Number.isFinite(prev)) {
          const d = e - prev;
          if (d > 0) gain += d;
          else loss += -d;
        }
      }
    }
    if (valid >= 2) {
      elevGainM = Math.round(gain);
      elevLossM = Math.round(loss);
      elevMinM = Math.round(min);
      elevMaxM = Math.round(max);
      if (distanceKmTotal > 0.05) {
        avgGradePct = Math.round(((gain + loss) / (distanceKmTotal * 1000)) * 1000) / 10;
      }
    }
  }

  return {
    distanceKm: Math.round(distanceKmTotal * 100) / 100,
    etaMinutes: estimateEtaMinutes(distanceKmTotal, mode),
    elevGainM,
    elevLossM,
    elevMinM,
    elevMaxM,
    avgGradePct,
    surfaces,
  };
}

export const SURFACE_LABELS: Record<SurfaceBucket, string> = {
  asphalt: "Asfalto",
  gravel: "Grava",
  dirt: "Tierra",
  track: "Pista",
  path: "Sendero",
  road: "Carretera",
  unknown: "Desconocido",
};
