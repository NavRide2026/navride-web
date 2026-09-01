import type { LngLat, TransportMode } from "./routing";
import { haversineKm } from "./geo";

export type RouteHealth = "GOOD" | "REVIEW" | "INVALID";

export type RouteHealthReport = {
  health: RouteHealth;
  issues: string[];
  warnings: string[];
};

export type SegmentHealthInput = {
  waypoints: LngLat[];
  routePoints: LngLat[];
  mode: TransportMode;
  routingFailed?: boolean;
};

export function analyzeRouteHealth(segs: SegmentHealthInput[]): RouteHealthReport {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (segs.every((s) => s.waypoints.length < 2 && s.routePoints.length < 2)) {
    return { health: "INVALID", issues: ["La ruta no tiene suficientes puntos."], warnings: [] };
  }

  for (const seg of segs) {
    const pts =
      seg.routePoints.length >= 2 ? seg.routePoints : seg.waypoints;

    if (seg.routingFailed) {
      issues.push(
        `Tramo sin ruta calculada en modo ${seg.mode} — no se dibuja línea recta silenciosa.`,
      );
    }

    if (pts.length >= 2 && seg.waypoints.length >= 2 && seg.routePoints.length === 0) {
      warnings.push("Waypoints sin geometría enrutada — revisa antes de guardar.");
    }

    for (let i = 1; i < pts.length; i++) {
      const d = haversineKm(pts[i - 1], pts[i]);
      if (d < 0.0001) {
        warnings.push("Segmento de longitud casi cero detectado.");
      }
    }

    if (pts.length >= 3) {
      const uTurn = detectImmediateUTurn(pts);
      if (uTurn) warnings.push("Posible cambio de sentido inmediato — revisa el waypoint.");
    }

    const gap = detectLargeGap(pts);
    if (gap) warnings.push(`Salto de ${gap.toFixed(1)} km entre puntos consecutivos.`);
  }

  if (issues.length > 0) return { health: "INVALID", issues, warnings };
  if (warnings.length > 0) return { health: "REVIEW", issues, warnings };
  return { health: "GOOD", issues, warnings };
}

function detectImmediateUTurn(pts: LngLat[]): boolean {
  if (pts.length < 3) return false;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = bearing(pts[i - 1], pts[i]);
    const b = bearing(pts[i], pts[i + 1]);
    const diff = Math.abs(((b - a + 540) % 360) - 180);
    const d1 = haversineKm(pts[i - 1], pts[i]);
    const d2 = haversineKm(pts[i], pts[i + 1]);
    if (diff > 150 && d1 < 0.3 && d2 < 0.3) return true;
  }
  return false;
}

function bearing(a: LngLat, b: LngLat): number {
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(la2);
  const x =
    Math.cos(la1) * Math.sin(la2) -
    Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function detectLargeGap(pts: LngLat[]): number {
  let max = 0;
  for (let i = 1; i < pts.length; i++) {
    max = Math.max(max, haversineKm(pts[i - 1], pts[i]));
  }
  return max > 5 ? max : 0;
}
