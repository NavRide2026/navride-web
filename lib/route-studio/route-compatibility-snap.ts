import type { LngLat } from "./routing.ts";
import { haversineKm } from "./geo.ts";
import {
  classifyWay,
  isBlocking,
  isPreferredSnapTarget,
  type CompatibilityResult,
  type WayTags,
} from "./route-compatibility.ts";
import type { TransportMode } from "./routing.ts";

export type OsmWay = {
  id: number;
  tags: WayTags;
  geometry: LngLat[];
};

export const COMPAT_SNAP_RADIUS_M = 40;
export const COMPAT_CLICK_LOCK_M = 10;
export const COMPAT_PREFER_GAP_M = 14;
export const COMPAT_MAX_SILENT_RELOCATE_M = 40;

export type WayHit = {
  way: OsmWay;
  distanceM: number;
  snapped: LngLat;
  classification: CompatibilityResult;
};

export function distancePointToWayM(click: LngLat, way: OsmWay): {
  distanceM: number;
  snapped: LngLat;
} {
  if (way.geometry.length === 0) {
    return { distanceM: Infinity, snapped: click };
  }
  if (way.geometry.length === 1) {
    return {
      distanceM: haversineKm(click, way.geometry[0]) * 1000,
      snapped: way.geometry[0],
    };
  }
  let bestD = Infinity;
  let best: LngLat = way.geometry[0];
  for (let i = 1; i < way.geometry.length; i++) {
    const p = closestOnSegment(click, way.geometry[i - 1], way.geometry[i]);
    const d = haversineKm(click, p) * 1000;
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return { distanceM: bestD, snapped: best };
}

function closestOnSegment(p: LngLat, a: LngLat, b: LngLat): LngLat {
  const [lng0, lat0] = a;
  const dx = (b[0] - a[0]) * Math.cos((lat0 * Math.PI) / 180);
  const dy = b[1] - a[1];
  const px = (p[0] - a[0]) * Math.cos((lat0 * Math.PI) / 180);
  const py = p[1] - a[1];
  const len2 = dx * dx + dy * dy;
  const t = len2 <= 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / len2));
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function rankWaysNearClick(
  click: LngLat,
  ways: OsmWay[],
  mode: TransportMode,
  radiusM = COMPAT_SNAP_RADIUS_M,
): WayHit[] {
  const hits: WayHit[] = [];
  for (const way of ways) {
    const { distanceM, snapped } = distancePointToWayM(click, way);
    if (distanceM > radiusM) continue;
    hits.push({
      way,
      distanceM,
      snapped,
      classification: classifyWay(way.tags, mode),
    });
  }
  hits.sort((a, b) => a.distanceM - b.distanceM);
  return hits;
}

export type SnapDecision =
  | {
      kind: "place";
      snapped: LngLat;
      hit: WayHit | null;
      preferredCompatible: boolean;
    }
  | {
      kind: "prompt";
      hit: WayHit;
      click: LngLat;
      nearbyCompatible: WayHit | null;
    };

/**
 * Prioriza vía compatible cercana, pero si el clic está claramente sobre
 * una vía incompatible no salta en silencio cientos de metros.
 */
export function decideEditorSnap(
  click: LngLat,
  hits: WayHit[],
): SnapDecision {
  if (hits.length === 0) {
    return { kind: "place", snapped: click, hit: null, preferredCompatible: false };
  }
  const closest = hits[0];
  const compatible = hits.filter((h) => isPreferredSnapTarget(h.classification.cls));
  const bestCompat = compatible[0] ?? null;

  if (isBlocking(closest.classification.cls)) {
    const gap = bestCompat ? bestCompat.distanceM - closest.distanceM : Infinity;
    const relocate = bestCompat?.distanceM ?? Infinity;
    const clearlyOnBad =
      closest.distanceM <= COMPAT_CLICK_LOCK_M &&
      (bestCompat == null ||
        gap > COMPAT_PREFER_GAP_M ||
        relocate > COMPAT_MAX_SILENT_RELOCATE_M);
    if (clearlyOnBad) {
      return {
        kind: "prompt",
        hit: closest,
        click,
        nearbyCompatible: bestCompat && relocate <= COMPAT_MAX_SILENT_RELOCATE_M
          ? bestCompat
          : null,
      };
    }
    if (bestCompat && relocate <= COMPAT_SNAP_RADIUS_M) {
      return {
        kind: "place",
        snapped: bestCompat.snapped,
        hit: bestCompat,
        preferredCompatible: true,
      };
    }
    return {
      kind: "prompt",
      hit: closest,
      click,
      nearbyCompatible: bestCompat,
    };
  }

  if (bestCompat && bestCompat.distanceM <= COMPAT_SNAP_RADIUS_M) {
    const prefer =
      bestCompat.way.id !== closest.way.id &&
      bestCompat.distanceM - closest.distanceM <= COMPAT_PREFER_GAP_M;
    const chosen = prefer ? bestCompat : closest;
    return {
      kind: "place",
      snapped: chosen.snapped,
      hit: chosen,
      preferredCompatible: prefer,
    };
  }

  return {
    kind: "place",
    snapped: closest.snapped,
    hit: closest,
    preferredCompatible: false,
  };
}
