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
