import { haversineM, type LngLat } from "./geo.ts";
import type { GpxDocument, GpxPoint } from "./types.ts";
import { lngLat } from "./ops.ts";

export type SurfaceBucket = {
  label: string;
  meters: number;
};

export type EditorStats = {
  distanceM: number;
  ascentM: number;
  descentM: number;
  eleMin: number | null;
  eleMax: number | null;
  selectedDistanceM: number;
  surfaces: SurfaceBucket[];
};

const ELE_THRESHOLD = 3;

export function elevationGainLoss(pts: GpxPoint[]): { gain: number; loss: number; min: number | null; max: number | null } {
  let gain = 0;
  let loss = 0;
  let min: number | null = null;
  let max: number | null = null;
  let last: number | null = null;
  for (const p of pts) {
    const e = p.ele;
    if (e == null || !Number.isFinite(e)) continue;
    min = min == null ? e : Math.min(min, e);
    max = max == null ? e : Math.max(max, e);
    if (last != null) {
      const d = e - last;
      if (d > ELE_THRESHOLD) gain += d;
      else if (d < -ELE_THRESHOLD) loss += -d;
    }
    last = e;
  }
  return { gain, loss, min, max };
}

export function computeStats(
  doc: GpxDocument,
  selected?: { startM: number; endM: number } | null,
  surfaces?: SurfaceBucket[],
): EditorStats {
  const pts: GpxPoint[] = [];
  for (const t of doc.tracks) {
    if (t.hidden) continue;
    for (const s of t.segments) pts.push(...s.points);
  }
  let distanceM = 0;
  for (let i = 1; i < pts.length; i++) distanceM += haversineM(lngLat(pts[i - 1]), lngLat(pts[i]));
  const { gain, loss, min, max } = elevationGainLoss(pts);
  let selectedDistanceM = 0;
  if (selected) {
    selectedDistanceM = Math.max(0, selected.endM - selected.startM);
  }
  return {
    distanceM,
    ascentM: gain,
    descentM: loss,
    eleMin: min,
    eleMax: max,
    selectedDistanceM,
    surfaces: surfaces ?? [],
  };
}

export type ProfileSample = {
  distM: number;
  ele: number | null;
  lat: number;
  lon: number;
  slopePct: number | null;
};

export function elevationProfile(doc: GpxDocument, stepM = 25): ProfileSample[] {
  const pts: GpxPoint[] = [];
  for (const t of doc.tracks) {
    if (t.hidden) continue;
    for (const s of t.segments) pts.push(...s.points);
  }
  if (pts.length === 0) return [];
  const out: ProfileSample[] = [];
  let acc = 0;
  out.push({
    distM: 0,
    ele: pts[0].ele ?? null,
    lat: pts[0].lat,
    lon: pts[0].lon,
    slopePct: null,
  });
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = haversineM(lngLat(a), lngLat(b));
    const slope =
      a.ele != null && b.ele != null && seg > 0.5
        ? ((b.ele - a.ele) / seg) * 100
        : null;
    acc += seg;
    if (seg >= stepM || i === pts.length - 1) {
      out.push({
        distM: acc,
        ele: b.ele ?? null,
        lat: b.lat,
        lon: b.lon,
        slopePct: slope,
      });
    }
  }
  return out;
}

export function ll(p: { lon: number; lat: number }): LngLat {
  return [p.lon, p.lat];
}
