import type { LngLat } from "./routing";

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
