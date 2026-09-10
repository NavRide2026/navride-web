/**
 * Local-first GPX operations. Crop/reverse/round-trip/replace-span semantics
 * adapted from gpx.studio MIT gpx library. No server round-trip.
 */
import { haversineM, interpolatePoints, polylineLengthM, ramerDouglasPeucker, type LngLat } from "./geo.ts";
import { markSegmentAnchors, neighbouringAnchors } from "./anchors.ts";
import {
  cloneDoc,
  ensureActiveTrack,
  type GpxDocument,
  type GpxPoint,
  type GpxTrack,
  type GpxWaypoint,
  type MergeMode,
  type SplitMode,
  uid,
} from "./types.ts";

export function markDirty(doc: GpxDocument): GpxDocument {
  doc.dirty = true;
  return doc;
}

export function lngLat(p: GpxPoint): LngLat {
  return [p.lon, p.lat];
}

export function toPoint(ll: LngLat, template?: GpxPoint): GpxPoint {
  return {
    lat: ll[1],
    lon: ll[0],
    ele: template?.ele ?? null,
    time: null,
    name: null,
    anchor: false,
    minZoom: 22,
  };
}

export function replaceSpan(
  points: GpxPoint[],
  fromIdx: number,
  toIdx: number,
  replacement: GpxPoint[],
): GpxPoint[] {
  if (points.length === 0) return [...replacement];
  const a = Math.max(0, Math.min(fromIdx, points.length - 1));
  const b = Math.max(0, Math.min(toIdx, points.length - 1));
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return [...points.slice(0, lo), ...replacement, ...points.slice(hi + 1)];
}

export function reversePoints(pts: GpxPoint[]): GpxPoint[] {
  if (pts.length < 2) return [...pts];
  const times = pts.map((p) => p.time).filter(Boolean) as string[];
  const rev = [...pts].reverse().map((p) => ({ ...p }));
  if (times.length === pts.length) {
    for (let i = 0; i < rev.length; i++) rev[i].time = times[i];
  }
  return rev;
}

export function reverseDocument(doc: GpxDocument, trackIndex?: number): GpxDocument {
  const out = cloneDoc(doc);
  const tracks = trackIndex == null ? out.tracks : [out.tracks[trackIndex]].filter(Boolean);
  for (const t of tracks) {
    t.segments.reverse();
    for (const s of t.segments) {
      s.points = reversePoints(s.points);
      markSegmentAnchors(s.points);
    }
  }
  if (trackIndex == null) out.tracks.reverse();
  return markDirty(out);
}

export function roundTripDocument(doc: GpxDocument): GpxDocument {
  const out = cloneDoc(doc);
  for (const t of out.tracks) {
    for (const s of t.segments) {
      if (s.points.length < 2) continue;
      const back = reversePoints(s.points).slice(1);
      s.points = [...s.points, ...back];
      markSegmentAnchors(s.points);
    }
  }
  return markDirty(out);
}

export function isClosed(pts: GpxPoint[], epsilonM = 25): boolean {
  if (pts.length < 3) return false;
  return haversineM(lngLat(pts[0]), lngLat(pts[pts.length - 1])) <= epsilonM;
}

export function rotateLoopStart(doc: GpxDocument, pointIndex: number): GpxDocument {
  const out = cloneDoc(doc);
  const t = out.tracks[0];
  if (!t) return out;
  const s = t.segments[0];
  if (!s || s.points.length < 3) return out;
  let ring = [...s.points];
  if (isClosed(ring)) ring = ring.slice(0, -1);
  const i = Math.max(0, Math.min(pointIndex, ring.length - 1));
  s.points = [...ring.slice(i), ...ring.slice(0, i), { ...ring[i] }];
  markSegmentAnchors(s.points);
  return markDirty(out);
}

export function cropDocument(doc: GpxDocument, start: number, end: number): GpxDocument {
  const out = cloneDoc(doc);
  const lo = Math.max(0, Math.min(start, end));
  const hi = Math.max(start, end);
  let cursor = 0;
  for (const t of out.tracks) {
    for (const s of t.segments) {
      const len = s.points.length;
      const a = lo - cursor;
      const b = hi - cursor;
      if (b < 0 || a >= len) {
        s.points = [];
      } else {
        s.points = s.points.slice(Math.max(0, a), Math.min(len, b + 1));
        markSegmentAnchors(s.points);
      }
      cursor += len;
    }
    t.segments = t.segments.filter((s) => s.points.length > 0);
  }
  out.tracks = out.tracks.filter((t) => t.segments.length > 0);
  if (out.tracks.length === 0) {
    out.tracks.push({
      id: uid("trk"),
      name: out.name,
      hidden: false,
      segments: [{ id: uid("seg"), points: [] }],
    });
  }
  return markDirty(out);
}

export function splitDocument(
  doc: GpxDocument,
  pointIndex: number,
  mode: SplitMode,
): GpxDocument {
  const out = cloneDoc(doc);
  let cursor = 0;
  for (let ti = 0; ti < out.tracks.length; ti++) {
    const t = out.tracks[ti];
    for (let si = 0; si < t.segments.length; si++) {
      const s = t.segments[si];
      const local = pointIndex - cursor;
      if (local >= 0 && local < s.points.length) {
        const left = s.points.slice(0, local + 1);
        const right = s.points.slice(local);
        if (right.length < 2 || left.length < 2) return out;
        if (mode === "segments") {
          s.points = left;
          markSegmentAnchors(s.points);
          const neu = { id: uid("seg"), points: right };
          markSegmentAnchors(neu.points);
          t.segments.splice(si + 1, 0, neu);
        } else {
          s.points = left;
          markSegmentAnchors(s.points);
          const neuTrack: GpxTrack = {
            id: uid("trk"),
            name: `${t.name} (2)`,
            hidden: false,
            segments: [{ id: uid("seg"), points: right }],
          };
          markSegmentAnchors(neuTrack.segments[0].points);
          out.tracks.splice(ti + 1, 0, neuTrack);
        }
        return markDirty(out);
      }
      cursor += s.points.length;
    }
  }
  return out;
}

export function mergeTracks(doc: GpxDocument, mode: MergeMode): GpxDocument {
  const out = cloneDoc(doc);
  if (out.tracks.length < 2) {
    const t = out.tracks[0];
    if (t && t.segments.length > 1 && mode === "connect") {
      const pts = t.segments.flatMap((s) => s.points);
      t.segments = [{ id: uid("seg"), points: pts }];
      markSegmentAnchors(t.segments[0].points);
      return markDirty(out);
    }
    return out;
  }
  const first = out.tracks[0];
  for (let i = 1; i < out.tracks.length; i++) {
    const other = out.tracks[i];
    if (mode === "connect") {
      first.segments.push(...other.segments);
      const pts = first.segments.flatMap((s) => s.points);
      first.segments = [{ id: uid("seg"), points: pts }];
      markSegmentAnchors(first.segments[0].points);
    } else {
      first.segments.push(...other.segments);
    }
  }
  out.tracks = [first];
  return markDirty(out);
}

export function simplifyDocument(doc: GpxDocument, epsilonM: number): {
  doc: GpxDocument;
  before: number;
  after: number;
} {
  const before = doc.tracks.reduce(
    (n, t) => n + t.segments.reduce((m, s) => m + s.points.length, 0),
    0,
  );
  const out = cloneDoc(doc);
  for (const t of out.tracks) {
    for (const s of t.segments) {
      if (s.points.length < 3) continue;
      const ll = s.points.map(lngLat);
      const keep = ramerDouglasPeucker(ll, Math.max(0.5, epsilonM));
      const idxs = keep.map((k) => k.index).sort((a, b) => a - b);
      s.points = idxs.map((i) => s.points[i]);
      markSegmentAnchors(s.points);
    }
  }
  const after = out.tracks.reduce(
    (n, t) => n + t.segments.reduce((m, s) => m + s.points.length, 0),
    0,
  );
  return { doc: markDirty(out), before, after };
}

export function estimateSimplify(doc: GpxDocument, epsilonM: number): {
  before: number;
  after: number;
} {
  let before = 0;
  let after = 0;
  for (const t of doc.tracks) {
    for (const s of t.segments) {
      before += s.points.length;
      if (s.points.length < 3) {
        after += s.points.length;
        continue;
      }
      after += ramerDouglasPeucker(s.points.map(lngLat), Math.max(0.5, epsilonM)).length;
    }
  }
  return { before, after };
}

export function appendPoint(
  doc: GpxDocument,
  point: GpxPoint,
  routed?: GpxPoint[],
): GpxDocument {
  const out = cloneDoc(doc);
  const { trackIndex, segmentIndex } = ensureActiveTrack(out);
  const seg = out.tracks[trackIndex].segments[segmentIndex];
  point.anchor = true;
  point.minZoom = 0;
  if (seg.points.length === 0 || !routed || routed.length < 2) {
    seg.points.push(point);
  } else {
    const mid = routed.slice(1);
    if (mid.length === 0 || mid[mid.length - 1].lat !== point.lat) {
      mid.push(point);
    } else {
      mid[mid.length - 1] = { ...mid[mid.length - 1], ...point, anchor: true, minZoom: 0 };
    }
    for (const p of mid) {
      if (p !== mid[mid.length - 1]) {
        p.anchor = false;
        p.minZoom = 22;
      }
    }
    seg.points.push(...mid);
  }
  firstLast(seg.points);
  return markDirty(out);
}

function firstLast(points: GpxPoint[]): void {
  if (!points.length) return;
  points[0].anchor = true;
  points[0].minZoom = 0;
  points[points.length - 1].anchor = true;
  points[points.length - 1].minZoom = 0;
}

export function moveAnchor(
  doc: GpxDocument,
  trackIndex: number,
  segmentIndex: number,
  pointIndex: number,
  dest: GpxPoint,
  prevRoute?: GpxPoint[],
  nextRoute?: GpxPoint[],
): GpxDocument {
  const out = cloneDoc(doc);
  const seg = out.tracks[trackIndex]?.segments[segmentIndex];
  if (!seg) return out;
  const { prev } = neighbouringAnchors(seg.points, pointIndex);
  dest.anchor = true;
  dest.minZoom = 0;
  let pts = seg.points;
  if (prev != null && prevRoute && prevRoute.length >= 2) {
    pts = replaceSpan(pts, prev, pointIndex, prevRoute);
    pointIndex = prev + prevRoute.length - 1;
    pts[pointIndex] = { ...pts[pointIndex], ...dest, anchor: true, minZoom: 0 };
  } else {
    pts[pointIndex] = { ...pts[pointIndex], ...dest, anchor: true, minZoom: 0 };
  }
  const moved = neighbouringAnchors(pts, pointIndex);
  if (moved.next != null && nextRoute && nextRoute.length >= 2) {
    pts = replaceSpan(pts, pointIndex, moved.next, nextRoute);
  }
  firstLast(pts);
  seg.points = pts;
  return markDirty(out);
}

export function insertAnchor(
  doc: GpxDocument,
  trackIndex: number,
  segmentIndex: number,
  pointIndex: number,
  point: GpxPoint,
): GpxDocument {
  const out = cloneDoc(doc);
  const seg = out.tracks[trackIndex]?.segments[segmentIndex];
  if (!seg) return out;
  point.anchor = true;
  point.minZoom = 0;
  seg.points.splice(pointIndex, 0, point);
  firstLast(seg.points);
  return markDirty(out);
}

export function deleteAnchor(
  doc: GpxDocument,
  trackIndex: number,
  segmentIndex: number,
  pointIndex: number,
  reconnect?: GpxPoint[],
): GpxDocument {
  const out = cloneDoc(doc);
  const seg = out.tracks[trackIndex]?.segments[segmentIndex];
  if (!seg || seg.points.length <= 2) {
    if (seg && seg.points.length <= 2) {
      seg.points = [];
      return markDirty(out);
    }
    return out;
  }
  const { prev, next } = neighbouringAnchors(seg.points, pointIndex);
  if (prev != null && next != null && reconnect && reconnect.length >= 2) {
    seg.points = replaceSpan(seg.points, prev, next, reconnect);
  } else {
    seg.points.splice(pointIndex, 1);
  }
  firstLast(seg.points);
  return markDirty(out);
}

export function closeWithRoute(doc: GpxDocument, routed: GpxPoint[]): GpxDocument {
  const out = cloneDoc(doc);
  const { trackIndex, segmentIndex } = ensureActiveTrack(out);
  const seg = out.tracks[trackIndex].segments[segmentIndex];
  if (seg.points.length < 2 || routed.length < 2) return out;
  const mid = routed.slice(1);
  seg.points.push(...mid);
  firstLast(seg.points);
  return markDirty(out);
}

export function backToStart(doc: GpxDocument, routed: GpxPoint[]): GpxDocument {
  return closeWithRoute(doc, routed);
}

export function addWaypoint(
  doc: GpxDocument,
  wpt: Omit<GpxWaypoint, "id"> & { id?: string },
): GpxDocument {
  const out = cloneDoc(doc);
  out.waypoints.push({
    id: wpt.id ?? uid("wpt"),
    lat: wpt.lat,
    lon: wpt.lon,
    ele: wpt.ele ?? null,
    name: wpt.name || "Waypoint",
    desc: wpt.desc || "",
    cmt: wpt.cmt ?? null,
    sym: wpt.sym ?? "Flag",
    type: wpt.type ?? null,
    time: wpt.time ?? null,
    extensionsXml: wpt.extensionsXml ?? null,
  });
  return markDirty(out);
}

export function moveWaypoint(doc: GpxDocument, id: string, lat: number, lon: number): GpxDocument {
  const out = cloneDoc(doc);
  const w = out.waypoints.find((x) => x.id === id);
  if (!w) return out;
  w.lat = lat;
  w.lon = lon;
  return markDirty(out);
}

export function deleteWaypoint(doc: GpxDocument, id: string): GpxDocument {
  const out = cloneDoc(doc);
  out.waypoints = out.waypoints.filter((w) => w.id !== id);
  return markDirty(out);
}

export function updateWaypoint(
  doc: GpxDocument,
  id: string,
  patch: Partial<GpxWaypoint>,
): GpxDocument {
  const out = cloneDoc(doc);
  const w = out.waypoints.find((x) => x.id === id);
  if (!w) return out;
  Object.assign(w, patch);
  return markDirty(out);
}

export function deleteInBounds(
  doc: GpxDocument,
  south: number,
  west: number,
  north: number,
  east: number,
  kind: "points" | "waypoints" | "both" = "both",
): GpxDocument {
  const out = cloneDoc(doc);
  const inside = (lat: number, lon: number) =>
    lat >= south && lat <= north && lon >= west && lon <= east;
  if (kind === "waypoints" || kind === "both") {
    out.waypoints = out.waypoints.filter((w) => !inside(w.lat, w.lon));
  }
  if (kind === "points" || kind === "both") {
    for (const t of out.tracks) {
      for (const s of t.segments) {
        s.points = s.points.filter((p) => !inside(p.lat, p.lon));
        markSegmentAnchors(s.points);
      }
    }
  }
  return markDirty(out);
}

export function setTrackHidden(doc: GpxDocument, trackIndex: number, hidden: boolean): GpxDocument {
  const out = cloneDoc(doc);
  if (out.tracks[trackIndex]) out.tracks[trackIndex].hidden = hidden;
  return markDirty(out);
}

export function renameTrack(doc: GpxDocument, trackIndex: number, name: string): GpxDocument {
  const out = cloneDoc(doc);
  if (out.tracks[trackIndex]) out.tracks[trackIndex].name = name;
  return markDirty(out);
}

export function duplicateTrack(doc: GpxDocument, trackIndex: number): GpxDocument {
  const out = cloneDoc(doc);
  const t = out.tracks[trackIndex];
  if (!t) return out;
  const copy = cloneDoc(t);
  copy.id = uid("trk");
  copy.name = `${t.name} copia`;
  out.tracks.splice(trackIndex + 1, 0, copy);
  return markDirty(out);
}

export function deleteTrack(doc: GpxDocument, trackIndex: number): GpxDocument {
  const out = cloneDoc(doc);
  out.tracks.splice(trackIndex, 1);
  if (out.tracks.length === 0) {
    out.tracks.push({
      id: uid("trk"),
      name: out.name,
      hidden: false,
      segments: [{ id: uid("seg"), points: [] }],
    });
  }
  return markDirty(out);
}

export function reorderTrack(doc: GpxDocument, from: number, to: number): GpxDocument {
  const out = cloneDoc(doc);
  if (from < 0 || to < 0 || from >= out.tracks.length || to >= out.tracks.length) return out;
  const [t] = out.tracks.splice(from, 1);
  out.tracks.splice(to, 0, t);
  return markDirty(out);
}

export function newDocument(name = "Mi ruta"): GpxDocument {
  return {
    name,
    description: "",
    creator: "NavRide GPX Editor",
    waypoints: [],
    tracks: [
      {
        id: uid("trk"),
        name,
        hidden: false,
        segments: [{ id: uid("seg"), points: [] }],
      },
    ],
    originalXml: null,
    dirty: false,
    capsule: null,
    navrideRoute: null,
    extraExtensionsXml: null,
  };
}

export function straightRoute(a: GpxPoint, b: GpxPoint): GpxPoint[] {
  return interpolatePoints(lngLat(a), lngLat(b), 30).map((ll, i, arr) => {
    const t = i / Math.max(1, arr.length - 1);
    const ele =
      a.ele != null && b.ele != null && Number.isFinite(a.ele) && Number.isFinite(b.ele)
        ? a.ele + (b.ele - a.ele) * t
        : null;
    return { ...toPoint(ll), ele, anchor: i === 0 || i === arr.length - 1, minZoom: i === 0 || i === arr.length - 1 ? 0 : 22 };
  });
}

export function totalLengthM(doc: GpxDocument): number {
  let d = 0;
  for (const t of doc.tracks) {
    if (t.hidden) continue;
    for (const s of t.segments) d += polylineLengthM(s.points.map(lngLat));
  }
  return d;
}
