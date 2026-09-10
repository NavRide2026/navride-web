/**
 * Zoom-aware anchors. Methodology adapted from gpx.studio (MIT):
 * imported tracks do not show every trackpoint; RDP keeps shape handles
 * and minZoom hides them until the user zooms in.
 */
import { ramerDouglasPeucker, zoomForDistance, type LngLat } from "./geo.ts";
import type { AnchorRef, GpxDocument, GpxPoint } from "./types.ts";
import { uid } from "./types.ts";

const ANCHOR_RDP_M = 1;

export function markSegmentAnchors(points: GpxPoint[]): void {
  if (points.length === 0) return;
  const lnglats: LngLat[] = points.map((p) => [p.lon, p.lat]);
  for (const p of points) {
    p.anchor = false;
    p.minZoom = 22;
  }
  const kept = ramerDouglasPeucker(lnglats, ANCHOR_RDP_M);
  for (const k of kept) {
    const p = points[k.index];
    p.anchor = true;
    p.minZoom = zoomForDistance(p.lat, k.distance);
  }
  points[0].anchor = true;
  points[0].minZoom = 0;
  points[points.length - 1].anchor = true;
  points[points.length - 1].minZoom = 0;
}

export function markDocumentAnchors(doc: GpxDocument): void {
  for (const t of doc.tracks) {
    for (const s of t.segments) markSegmentAnchors(s.points);
  }
}

export function visibleAnchors(doc: GpxDocument, zoom: number): AnchorRef[] {
  const out: AnchorRef[] = [];
  doc.tracks.forEach((t, ti) => {
    if (t.hidden) return;
    t.segments.forEach((s, si) => {
      s.points.forEach((p, pi) => {
        if (!p.anchor) return;
        if ((p.minZoom ?? 0) > zoom) return;
        out.push({
          id: uid("a"),
          trackIndex: ti,
          segmentIndex: si,
          pointIndex: pi,
          lat: p.lat,
          lon: p.lon,
          minZoom: p.minZoom ?? 0,
        });
      });
    });
  });
  return out;
}

export function neighbouringAnchors(
  points: GpxPoint[],
  pointIndex: number,
): { prev: number | null; next: number | null } {
  let prev: number | null = null;
  let next: number | null = null;
  for (let i = 0; i < points.length; i++) {
    if (!points[i].anchor) continue;
    if (i < pointIndex) prev = i;
    if (i > pointIndex && next == null) next = i;
  }
  return { prev, next };
}

export function firstLastAlwaysAnchors(points: GpxPoint[]): void {
  if (points.length === 0) return;
  points[0].anchor = true;
  points[0].minZoom = 0;
  points[points.length - 1].anchor = true;
  points[points.length - 1].minZoom = 0;
}
