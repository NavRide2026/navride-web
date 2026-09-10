/**
 * Geodesy + Ramer–Douglas–Peucker for NavRide GPX editor.
 *
 * The RDP / cross-arc distance algorithm is adapted from the MIT-licensed
 * gpx.studio `gpx` library (Copyright (c) 2026 gpx.studio). See
 * lib/gpx-editor/THIRD_PARTY_NOTICES.md. No branding, UI, keys or servers
 * from gpx.studio are used.
 */

export type LngLat = [number, number];

const EARTH_R = 6371008.8;
const METERS_PER_LAT = 111320;

export function haversineM(a: LngLat, b: LngLat): number {
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return EARTH_R * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function haversineKm(a: LngLat, b: LngLat): number {
  return haversineM(a, b) / 1000;
}

export function polylineLengthM(pts: LngLat[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += haversineM(pts[i - 1], pts[i]);
  return d;
}

function metersPerLon(lat: number): number {
  return Math.cos((lat * Math.PI) / 180) * METERS_PER_LAT;
}

/** Perpendicular distance in meters from C to great-circle A–B. */
export function crossarcDistanceM(a: LngLat, b: LngLat, c: LngLat): number {
  const lat = (a[1] + b[1] + c[1]) / 3;
  const mx = metersPerLon(lat);
  const ax = a[0] * mx;
  const ay = a[1] * METERS_PER_LAT;
  const bx = b[0] * mx;
  const by = b[1] * METERS_PER_LAT;
  const cx = c[0] * mx;
  const cy = c[1] * METERS_PER_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-6) return Math.hypot(cx - ax, cy - ay);
  let t = ((cx - ax) * dx + (cy - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(cx - (ax + t * dx), cy - (ay + t * dy));
}

export type RdpKeep = { index: number; distance: number };

/**
 * Ramer–Douglas–Peucker. Always keeps first and last. `distance` on kept
 * interior points is the deviation that justified keeping them (meters).
 */
export function ramerDouglasPeucker(
  pts: LngLat[],
  epsilonM = 1,
): RdpKeep[] {
  if (pts.length === 0) return [];
  if (pts.length === 1) return [{ index: 0, distance: 0 }];
  const kept: RdpKeep[] = [{ index: 0, distance: 0 }];
  rdpRec(pts, epsilonM, 0, pts.length - 1, kept);
  kept.push({ index: pts.length - 1, distance: 0 });
  return kept;
}

function rdpRec(
  pts: LngLat[],
  epsilon: number,
  start: number,
  end: number,
  out: RdpKeep[],
): void {
  let largestI = 0;
  let largestD = 0;
  for (let i = start + 1; i < end; i++) {
    const d = crossarcDistanceM(pts[start], pts[end], pts[i]);
    if (d > largestD) {
      largestD = d;
      largestI = i;
    }
  }
  if (largestD > epsilon && largestI !== 0) {
    rdpRec(pts, epsilon, start, largestI, out);
    out.push({ index: largestI, distance: largestD });
    rdpRec(pts, epsilon, largestI, end, out);
  }
}

export const MIN_ANCHOR_ZOOM = 0;
export const MAX_ANCHOR_ZOOM = 22;

/** Zoom at which an RDP deviation becomes visible. Adapted from gpx.studio. */
export function zoomForDistance(latitude: number, distanceM?: number): number {
  if (distanceM == null || !Number.isFinite(distanceM) || distanceM <= 0) {
    return MIN_ANCHOR_ZOOM;
  }
  const lat = (latitude * Math.PI) / 180;
  const z = Math.round(Math.log2((EARTH_R * Math.cos(lat)) / distanceM));
  return Math.min(MAX_ANCHOR_ZOOM, Math.max(MIN_ANCHOR_ZOOM, z));
}

export function pointAtDistanceM(pts: LngLat[], targetM: number): LngLat | null {
  if (pts.length === 0) return null;
  if (pts.length === 1) return pts[0];
  let acc = 0;
  const target = Math.max(0, targetM);
  for (let i = 1; i < pts.length; i++) {
    const seg = haversineM(pts[i - 1], pts[i]);
    if (acc + seg >= target) {
      const t = seg <= 0 ? 0 : (target - acc) / seg;
      const a = pts[i - 1];
      const b = pts[i];
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    acc += seg;
  }
  return pts[pts.length - 1];
}

export type NearestOnLine = {
  progressM: number;
  snapped: LngLat;
  distanceM: number;
  index: number;
  fraction: number;
};

export function nearestOnPolyline(click: LngLat, pts: LngLat[]): NearestOnLine | null {
  if (pts.length === 0) return null;
  if (pts.length === 1) {
    return {
      progressM: 0,
      snapped: pts[0],
      distanceM: haversineM(click, pts[0]),
      index: 0,
      fraction: 0,
    };
  }
  let best: NearestOnLine | null = null;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const lat = (a[1] + b[1]) / 2;
    const mx = metersPerLon(lat);
    const ax = a[0] * mx;
    const ay = a[1] * METERS_PER_LAT;
    const bx = b[0] * mx;
    const by = b[1] * METERS_PER_LAT;
    const cx = click[0] * mx;
    const cy = click[1] * METERS_PER_LAT;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 < 1e-6 ? 0 : Math.max(0, Math.min(1, ((cx - ax) * dx + (cy - ay) * dy) / len2));
    const sx = ax + t * dx;
    const sy = ay + t * dy;
    const snapped: LngLat = [sx / mx, sy / METERS_PER_LAT];
    const d = haversineM(click, snapped);
    const progressM = acc + t * haversineM(a, b);
    if (!best || d < best.distanceM) {
      best = { progressM, snapped, distanceM: d, index: i - 1, fraction: t };
    }
    acc += haversineM(a, b);
  }
  return best;
}

export function interpolatePoints(a: LngLat, b: LngLat, stepM = 25): LngLat[] {
  const d = haversineM(a, b);
  if (d < stepM) return [a, b];
  const n = Math.max(2, Math.ceil(d / stepM));
  const out: LngLat[] = [a];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  out.push(b);
  return out;
}
