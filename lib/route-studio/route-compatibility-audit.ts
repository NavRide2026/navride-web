import type { LngLat, TransportMode } from "./routing.ts";
import { haversineKm } from "./geo.ts";
import {
  classifyWay,
  modeLabelEs,
  type CompatibilityClass,
  type CompatibilityResult,
} from "./route-compatibility.ts";
import { distancePointToWayM, type OsmWay } from "./route-compatibility-snap.ts";

export type CompatibilityIssue = {
  id: string;
  cls: CompatibilityClass;
  startKm: number;
  endKm: number;
  lengthKm: number;
  reason: string;
  wayName: string;
  wayTypeLabel: string;
  classification: CompatibilityResult;
  start: LngLat;
  end: LngLat;
  midpoint: LngLat;
  geometry: LngLat[];
};

export type CompatibilityAudit = {
  analyzedKm: number;
  issueCount: number;
  issues: CompatibilityIssue[];
  disclaimer: string;
};

const SAMPLE_M = 45;

function samplePolyline(pts: LngLat[], stepM: number): { atKm: number; pt: LngLat }[] {
  if (pts.length === 0) return [];
  const out: { atKm: number; pt: LngLat }[] = [{ atKm: 0, pt: pts[0] }];
  let accM = 0;
  let next = stepM;
  for (let i = 1; i < pts.length; i++) {
    const segM = haversineKm(pts[i - 1], pts[i]) * 1000;
    let used = 0;
    while (used + 0.01 < segM && accM + (segM - used) >= next) {
      const t = (next - accM) / segM;
      const a = pts[i - 1];
      const b = pts[i];
      const pt: LngLat = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      out.push({ atKm: next / 1000, pt });
      next += stepM;
      used = next - accM - stepM;
    }
    accM += segM;
  }
  const totalKm = accM / 1000;
  const last = pts[pts.length - 1];
  if (out[out.length - 1].pt !== last) {
    out.push({ atKm: totalKm, pt: last });
  }
  return out;
}

function nearestWay(pt: LngLat, ways: OsmWay[]): OsmWay | null {
  let best: OsmWay | null = null;
  let bestD = 35;
  for (const w of ways) {
    const { distanceM } = distancePointToWayM(pt, w);
    if (distanceM < bestD) {
      bestD = distanceM;
      best = w;
    }
  }
  return best;
}

export function auditRouteGeometry(
  pts: LngLat[],
  ways: OsmWay[],
  mode: TransportMode,
): CompatibilityAudit {
  let analyzedKm = 0;
  for (let i = 1; i < pts.length; i++) analyzedKm += haversineKm(pts[i - 1], pts[i]);

  const samples = samplePolyline(pts, SAMPLE_M);
  type Row = {
    atKm: number;
    pt: LngLat;
    way: OsmWay | null;
    cls: CompatibilityClass;
    result: CompatibilityResult | null;
  };
  const rows: Row[] = samples.map((s) => {
    const way = nearestWay(s.pt, ways);
    if (!way) {
      return {
        atKm: s.atKm,
        pt: s.pt,
        way: null,
        cls: "UNKNOWN",
        result: classifyWay({}, mode),
      };
    }
    const result = classifyWay(way.tags, mode);
    return { atKm: s.atKm, pt: s.pt, way, cls: result.cls, result };
  });

  const issues: CompatibilityIssue[] = [];
  let i = 0;
  while (i < rows.length) {
    const cls = rows[i].cls;
    if (cls === "COMPATIBLE") {
      i += 1;
      continue;
    }
    let j = i + 1;
    const wayId = rows[i].way?.id ?? -1;
    while (
      j < rows.length &&
      rows[j].cls === cls &&
      (rows[j].way?.id ?? -1) === wayId
    ) {
      j += 1;
    }
    const start = rows[i];
    const end = rows[Math.max(i, j - 1)];
    const geom = rows.slice(i, j).map((r) => r.pt);
    const mid = geom[Math.floor(geom.length / 2)] ?? start.pt;
    const lengthKm = Math.max(0.01, end.atKm - start.atKm);
    const r = start.result!;
    issues.push({
      id: `${wayId}-${start.atKm.toFixed(3)}-${cls}`,
      cls,
      startKm: start.atKm,
      endKm: end.atKm,
      lengthKm,
      reason: issueHeadline(cls, r, mode),
      wayName: start.way?.tags["name"] ?? r.wayTypeLabel,
      wayTypeLabel: r.wayTypeLabel,
      classification: r,
      start: start.pt,
      end: end.pt,
      midpoint: mid,
      geometry: geom.length >= 2 ? geom : [start.pt, end.pt],
    });
    i = j;
  }

  return {
    analyzedKm,
    issueCount: issues.length,
    issues,
    disclaimer:
      "Según la información cartográfica disponible. NavRide ayuda a detectar problemas; no sustituye la señalización real, la normativa local ni restricciones temporales.",
  };
}

export function issueStrokeColor(cls: CompatibilityClass): string {
  if (cls === "INCOMPATIBLE") return "#ef4444";
  if (cls === "RESTRICTED") return "#f97316";
  if (cls === "WARNING") return "#eab308";
  return "#94a3b8";
}

export type CompatGeoJSON = {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, string | number>;
    geometry:
      | { type: "LineString"; coordinates: LngLat[] }
      | { type: "Point"; coordinates: LngLat };
  }[];
};

export function auditToGeoJSON(
  audit: CompatibilityAudit | null,
  keptIds: Set<string> = new Set(),
  altLine: LngLat[] | null = null,
): CompatGeoJSON {
  const features: CompatGeoJSON["features"] = [];
  if (audit) {
    for (const iss of audit.issues) {
      if (keptIds.has(iss.id)) continue;
      const color = issueStrokeColor(iss.cls);
      features.push({
        type: "Feature",
        properties: { kind: "span", id: iss.id, color, cls: iss.cls },
        geometry: { type: "LineString", coordinates: iss.geometry },
      });
      features.push({
        type: "Feature",
        properties: { kind: "mark", id: iss.id, color, cls: iss.cls },
        geometry: { type: "Point", coordinates: iss.midpoint },
      });
    }
  }
  if (altLine && altLine.length >= 2) {
    features.push({
      type: "Feature",
      properties: { kind: "span", id: "alt-preview", color: "#22c55e", cls: "COMPATIBLE" },
      geometry: { type: "LineString", coordinates: altLine },
    });
  }
  return { type: "FeatureCollection", features };
}

export function tailPolyline(pts: LngLat[], maxKm: number): {
  pts: LngLat[];
  offsetKm: number;
} {
  if (pts.length < 2) return { pts, offsetKm: 0 };
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += haversineKm(pts[i - 1], pts[i]);
  if (total <= maxKm) return { pts, offsetKm: 0 };
  let acc = 0;
  for (let i = pts.length - 1; i > 0; i--) {
    acc += haversineKm(pts[i - 1], pts[i]);
    if (acc >= maxKm) {
      return { pts: pts.slice(i - 1), offsetKm: Math.max(0, total - acc) };
    }
  }
  return { pts, offsetKm: 0 };
}

function issueHeadline(
  cls: CompatibilityClass,
  r: CompatibilityResult,
  mode: TransportMode,
): string {
  const modeUp = modeLabelEs(mode).toUpperCase();
  if (cls === "INCOMPATIBLE") {
    return `⚠ NO COMPATIBLE CON ${modeUp}. ${r.reason}`;
  }
  if (cls === "RESTRICTED") {
    return r.accessLabel === "Privado"
      ? `Acceso privado. ${r.reason}`
      : r.reason;
  }
  if (cls === "UNKNOWN") {
    return `Acceso desconocido. ${r.reason}`;
  }
  return r.reason;
}

export function mergeTailAudit(
  prev: CompatibilityAudit | null,
  tail: CompatibilityAudit,
  offsetKm: number,
): CompatibilityAudit {
  const kept = (prev?.issues ?? []).filter((i) => i.endKm <= offsetKm + 0.02);
  const shifted = tail.issues.map((i) => ({
    ...i,
    id: `${i.id}-t${offsetKm.toFixed(2)}`,
    startKm: i.startKm + offsetKm,
    endKm: i.endKm + offsetKm,
  }));
  const issues = [...kept, ...shifted];
  return {
    analyzedKm: offsetKm + tail.analyzedKm,
    issueCount: issues.length,
    issues,
    disclaimer: tail.disclaimer,
  };
}
