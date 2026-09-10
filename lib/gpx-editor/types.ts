import type { RouteCapsule } from "../route-studio/navride-route/route-capsule.ts";
import type { NavRideRoute } from "../route-studio/navride-route/types.ts";
import type { TransportMode } from "../route-studio/routing.ts";

export type { TransportMode };

export type GpxPoint = {
  lat: number;
  lon: number;
  ele?: number | null;
  time?: string | null;
  name?: string | null;
  cmt?: string | null;
  desc?: string | null;
  extensionsXml?: string | null;
  /** Editorial: visible handle. Not written to GPX. */
  anchor?: boolean;
  /** Editorial: minimum map zoom at which this anchor is shown. */
  minZoom?: number;
};

export type GpxSegment = {
  id: string;
  points: GpxPoint[];
  extensionsXml?: string | null;
};

export type GpxTrack = {
  id: string;
  name: string;
  type?: string | null;
  hidden: boolean;
  segments: GpxSegment[];
  extensionsXml?: string | null;
};

export type GpxWaypoint = {
  id: string;
  lat: number;
  lon: number;
  ele?: number | null;
  name: string;
  desc: string;
  cmt?: string | null;
  sym?: string | null;
  type?: string | null;
  time?: string | null;
  extensionsXml?: string | null;
};

export type GpxDocument = {
  name: string;
  description: string;
  creator: string;
  waypoints: GpxWaypoint[];
  tracks: GpxTrack[];
  originalXml: string | null;
  dirty: boolean;
  capsule: RouteCapsule | null;
  navrideRoute: NavRideRoute | null;
  extraExtensionsXml: string | null;
  metadataTime?: string | null;
};

export type EditorProfile = TransportMode;

export type TraceMode = "FOLLOW_WAYS" | "STRAIGHT";

export type SplitMode = "tracks" | "segments" | "files";

export type MergeMode = "connect" | "group";

export type AnchorRef = {
  id: string;
  trackIndex: number;
  segmentIndex: number;
  pointIndex: number;
  lat: number;
  lon: number;
  minZoom: number;
};

export type ToolId =
  | "none"
  | "crop"
  | "split"
  | "select"
  | "waypoint"
  | "poi";

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyDocument(name = "Mi ruta"): GpxDocument {
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

export function cloneDoc<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function allPoints(doc: GpxDocument): GpxPoint[] {
  const out: GpxPoint[] = [];
  for (const t of doc.tracks) {
    if (t.hidden) continue;
    for (const s of t.segments) out.push(...s.points);
  }
  return out;
}

export function allPointsIncludingHidden(doc: GpxDocument): GpxPoint[] {
  const out: GpxPoint[] = [];
  for (const t of doc.tracks) {
    for (const s of t.segments) out.push(...s.points);
  }
  return out;
}

export function pointCount(doc: GpxDocument): number {
  return allPointsIncludingHidden(doc).length;
}

export function lngLatsOf(doc: GpxDocument): [number, number][] {
  return allPoints(doc).map((p) => [p.lon, p.lat]);
}

export function ensureActiveTrack(doc: GpxDocument): {
  trackIndex: number;
  segmentIndex: number;
} {
  if (doc.tracks.length === 0) {
    doc.tracks.push({
      id: uid("trk"),
      name: doc.name || "Ruta",
      hidden: false,
      segments: [{ id: uid("seg"), points: [] }],
    });
  }
  const t = doc.tracks.length - 1;
  if (doc.tracks[t].segments.length === 0) {
    doc.tracks[t].segments.push({ id: uid("seg"), points: [] });
  }
  return { trackIndex: t, segmentIndex: doc.tracks[t].segments.length - 1 };
}
