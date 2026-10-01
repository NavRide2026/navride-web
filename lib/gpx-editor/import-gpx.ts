import {
  parseGpxFile,
  type RouteCapsule,
} from "@/lib/route-studio/navride-route/gpx-codec";
import type {
  NavRideCue,
  NavRideRoute,
} from "@/lib/route-studio/navride-route/types";
import {
  DEFAULT_ROUTE_SEGMENT_MODE,
  parseRouteSegmentMode,
  pathKindForSegmentMode,
  type RouteSegmentMode,
} from "@/lib/route-studio/segment-routing-mode";
import { ensureMinBrightness } from "@/lib/route-studio/track-style";
import type {
  ImportDialogState,
  LngLat,
  Segment,
  WaypointKind,
} from "./editor-types";

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

const IMPORT_COLORS = [
  "#f97316",
  "#ef4444",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#a855f7",
  "#e5e7eb",
];

export interface ImportedGeometry {
  segments: Segment[];
  activeId: string;
  drawMode: RouteSegmentMode;
  title: string | null;
  cues: NavRideCue[];
  capsule: RouteCapsule | null | undefined;
}

export function rebuildImportedGeometry({
  geometry,
  extensions,
  asTrackOnly,
  capsule,
}: {
  geometry: { lat: number; lon: number }[];
  extensions: NavRideRoute | null;
  asTrackOnly: boolean;
  capsule?: RouteCapsule | null;
}): ImportedGeometry | null {
  const points: LngLat[] = geometry.map((point) => [
    point.lon,
    point.lat,
  ]);
  if (points.length < 1) return null;

  const extSegments = extensions?.segments ?? [];
  if (
    !asTrackOnly &&
    extSegments.length > 0 &&
    extSegments.some(
      (segment) =>
        segment.routeSegmentMode ||
        segment.pathKind === "freehand" ||
        segment.pathKind === "routed",
    )
  ) {
    const rebuilt: Segment[] = extSegments.map((source, index) => {
      const start = Math.max(0, source.startIndex ?? 0);
      const end = Math.min(
        points.length - 1,
        source.endIndex ?? points.length - 1,
      );
      const slice = points.slice(start, end + 1);
      const mode = parseRouteSegmentMode(
        source.routeSegmentMode ??
          (source.pathKind === "freehand"
            ? "MANUAL_STRAIGHT"
            : "FOLLOW_ROAD"),
      );
      const waypoints =
        slice.length <= 2
          ? slice
          : [slice[0], slice[slice.length - 1]];
      return {
        id: source.segmentId || uid(),
        name: source.name || `Segmento ${index + 1}`,
        color: ensureMinBrightness(
          source.customColor ??
            IMPORT_COLORS[index % IMPORT_COLORS.length],
        ),
        waypoints,
        waypointKinds: waypoints.map(() => "via" as WaypointKind),
        routePoints: slice.length >= 2 ? slice : [],
        routingFailed: slice.length < 2,
        pathKind: (source.pathKind === "track"
          ? "track"
          : pathKindForSegmentMode(mode)) as
          | "routed"
          | "freehand"
          | "track",
        routeSegmentMode: mode,
      };
    });
    if (rebuilt.length > 0) {
      return {
        segments: rebuilt,
        activeId: rebuilt[0].id,
        drawMode:
          rebuilt[0].routeSegmentMode ?? DEFAULT_ROUTE_SEGMENT_MODE,
        title: extensions?.name ?? null,
        cues: extensions?.cues ?? [],
        capsule,
      };
    }
  }

  const via = extensions?.viaPoints ?? [];
  const shaping = extensions?.shapingPoints ?? [];
  let waypoints: LngLat[] = [];
  let waypointKinds: WaypointKind[] = [];

  if (!asTrackOnly && (via.length > 0 || shaping.length > 0)) {
    const merged = [
      ...via.map((point) => ({
        ll: [point.lon, point.lat] as LngLat,
        kind: "via" as WaypointKind,
      })),
      ...shaping.map((point) => ({
        ll: [point.lon, point.lat] as LngLat,
        kind: "shaping" as WaypointKind,
      })),
    ];
    waypoints = merged.map((entry) => entry.ll);
    waypointKinds = merged.map((entry) => entry.kind);
  } else {
    const step = Math.max(1, Math.floor(points.length / 40));
    for (let index = 0; index < points.length; index += step) {
      waypoints.push(points[index]);
      waypointKinds.push("via");
    }
    if (waypoints.length > 0) {
      const last = points[points.length - 1];
      const previous = waypoints[waypoints.length - 1];
      if (previous[0] !== last[0] || previous[1] !== last[1]) {
        waypoints.push(last);
        waypointKinds.push("via");
      }
    }
  }

  const firstMode = parseRouteSegmentMode(
    extSegments[0]?.routeSegmentMode ??
      (asTrackOnly
        ? "FOLLOW_ROAD"
        : extSegments[0]?.pathKind === "freehand"
          ? "MANUAL_STRAIGHT"
          : "FOLLOW_ROAD"),
  );
  const segment: Segment = {
    id: uid(),
    name: extensions?.name || "Importado",
    color: ensureMinBrightness(IMPORT_COLORS[0]),
    waypoints,
    waypointKinds,
    routePoints: points.length >= 2 ? points : [],
    routingFailed: points.length < 2,
    pathKind: asTrackOnly ? "track" : pathKindForSegmentMode(firstMode),
    routeSegmentMode: asTrackOnly
      ? DEFAULT_ROUTE_SEGMENT_MODE
      : firstMode,
  };

  return {
    segments: [segment],
    activeId: segment.id,
    drawMode: segment.routeSegmentMode ?? DEFAULT_ROUTE_SEGMENT_MODE,
    title: extensions?.name ?? null,
    cues: extensions?.cues ?? [],
    capsule,
  };
}

export async function parseGpxUpload(
  file: File,
): Promise<
  | { kind: "invalid"; message: string }
  | { kind: "ready"; imported: ImportedGeometry }
  | { kind: "dialog"; dialog: ImportDialogState }
> {
  const text = await file.text();
  const parsed = parseGpxFile(text);
  if (!parsed.recoverable) {
    return {
      kind: "invalid",
      message: parsed.issues[0] ?? "GPX no válido.",
    };
  }
  if (parsed.issues.length === 0 && parsed.geometry.length >= 2) {
    const imported = rebuildImportedGeometry({
      geometry: parsed.geometry,
      extensions: parsed.extensions,
      asTrackOnly: false,
      capsule: parsed.capsule,
    });
    if (imported) return { kind: "ready", imported };
  }
  return {
    kind: "dialog",
    dialog: {
      issues:
        parsed.issues.length > 0
          ? parsed.issues
          : ["GPX parcial — elige cómo importar."],
      geometry: parsed.geometry,
      extensions: parsed.extensions,
      capsule: parsed.capsule,
      fileName: file.name,
    },
  };
}
