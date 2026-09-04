import type { LngLat } from "./routing";

export type { LngLat };

export function haversineKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function totalKmFromSegments(
  segs: { routePoints: LngLat[]; waypoints: LngLat[] }[],
): number {
  return segs.reduce((acc, s) => {
    const pts = s.routePoints.length >= 2 ? s.routePoints : s.waypoints;
    let d = 0;
    for (let i = 1; i < pts.length; i++) d += haversineKm(pts[i - 1], pts[i]);
    return acc + d;
  }, 0);
}

/** Flatten routed (or waypoint) geometry across segments for along-route projection. */
export function flattenRouteLngLats(
  segs: { routePoints: LngLat[]; waypoints: LngLat[]; routingFailed?: boolean }[],
): LngLat[] {
  const out: LngLat[] = [];
  for (const s of segs) {
    const pts =
      s.routePoints.length >= 2 && !s.routingFailed ? s.routePoints : s.waypoints;
    if (pts.length === 0) continue;
    if (out.length === 0) {
      out.push(...pts);
    } else {
      // Avoid duplicating joint vertex between segments.
      out.push(...pts.slice(1));
    }
  }
  return out;
}

/** Point at distance along polyline (meters). Returns null if empty. */
export function lngLatAtProgressM(pts: LngLat[], progressM: number): LngLat | null {
  if (pts.length === 0) return null;
  if (pts.length === 1) return pts[0];
  const target = Math.max(0, progressM);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const segM = haversineKm(pts[i - 1], pts[i]) * 1000;
    if (acc + segM >= target) {
      const t = segM <= 0 ? 0 : (target - acc) / segM;
      const a = pts[i - 1];
      const b = pts[i];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    acc += segM;
  }
  return pts[pts.length - 1];
}

export type NearestOnPolyline = {
  /** Along-track meters from start of polyline. */
  progressM: number;
  /** Closest point on the polyline (may differ from click if off-track). */
  snapped: LngLat;
  /** Geodesic distance click → snapped (meters). */
  distanceToTrackM: number;
  segmentIndex: number;
  fraction: number;
};

/**
 * Project a map click onto the nearest polyline segment (haversine + ENU local).
 * Does NOT invent route distance: if empty polyline → null.
 */
export function progressMNearestOnPolyline(
  pts: LngLat[],
  click: LngLat,
): NearestOnPolyline | null {
  if (pts.length === 0) return null;
  if (pts.length === 1) {
    const d = haversineKm(pts[0], click) * 1000;
    return {
      progressM: 0,
      snapped: pts[0],
      distanceToTrackM: d,
      segmentIndex: 0,
      fraction: 0,
    };
  }

  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const origin = pts[0];
  const toEnu = (p: LngLat): [number, number] => {
    const lat0 = toRad(origin[1]);
    const lon0 = toRad(origin[0]);
    const lat = toRad(p[1]);
    const lon = toRad(p[0]);
    const x = (lon - lon0) * Math.cos(lat0) * R;
    const y = (lat - lat0) * R;
    return [x, y];
  };
  const fromEnu = (x: number, y: number): LngLat => {
    const lat0 = toRad(origin[1]);
    const lon0 = toRad(origin[0]);
    const lat = lat0 + y / R;
    const lon = lon0 + x / (R * Math.cos(lat0));
    return [(lon * 180) / Math.PI, (lat * 180) / Math.PI];
  };

  const c = toEnu(click);
  let bestDist = Infinity;
  let bestProgress = 0;
  let bestSnap: LngLat = pts[0];
  let bestSeg = 0;
  let bestFrac = 0;
  let acc = 0;

  for (let i = 1; i < pts.length; i++) {
    const a = toEnu(pts[i - 1]);
    const b = toEnu(pts[i]);
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const len2 = abx * abx + aby * aby;
    let t = 0;
    if (len2 > 1e-6) {
      t = ((c[0] - a[0]) * abx + (c[1] - a[1]) * aby) / len2;
      t = Math.max(0, Math.min(1, t));
    }
    const sx = a[0] + abx * t;
    const sy = a[1] + aby * t;
    const dx = c[0] - sx;
    const dy = c[1] - sy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const segM = haversineKm(pts[i - 1], pts[i]) * 1000;
    if (dist < bestDist) {
      bestDist = dist;
      bestProgress = acc + segM * t;
      bestSnap = fromEnu(sx, sy);
      bestSeg = i - 1;
      bestFrac = t;
    }
    acc += segM;
  }

  return {
    progressM: bestProgress,
    snapped: bestSnap,
    distanceToTrackM: bestDist,
    segmentIndex: bestSeg,
    fraction: bestFrac,
  };
}

/** Max snap distance (m) for editor follow-path: prefer NO_ROUTE over wrong road. */
export const EDITOR_MAX_SNAP_METERS = 25;

/** Off-track note threshold (m): keep lat/lon, null route offset. */
export const NOTE_OFF_TRACK_METERS = 40;
