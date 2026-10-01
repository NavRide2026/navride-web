import { postToNavRideApp } from "@/lib/route-studio/navride-editor-bridge";
import {
  exportGpxWithExtensions,
  type RouteCapsule,
} from "@/lib/route-studio/navride-route/gpx-codec";
import {
  createEmptyRoute,
  type NavRideCue,
  type NavRideRoute,
} from "@/lib/route-studio/navride-route/types";
import {
  parseRouteSegmentMode,
  pathKindForSegmentMode,
} from "@/lib/route-studio/segment-routing-mode";
import type { LngLat, Segment } from "./editor-types";

function ensureWaypointKinds(segment: Segment): ("via" | "shaping")[] {
  const kinds = segment.waypointKinds ? [...segment.waypointKinds] : [];
  while (kinds.length < segment.waypoints.length) kinds.push("via");
  return kinds.slice(0, segment.waypoints.length);
}

function idFallback(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function buildRouteJson(
  segments: Segment[],
  title: string,
  cues: NavRideCue[],
  trackPts: LngLat[],
): NavRideRoute {
  const viaPoints = segments.flatMap((segment) => {
    const kinds = ensureWaypointKinds(segment);
    return segment.waypoints
      .map((point, index) => ({
        point,
        kind: kinds[index] ?? "via",
        index,
      }))
      .filter((item) => item.kind === "via")
      .map(({ point, index }) => ({
        pointId: `${segment.id}-via-${index}`,
        kind: "via" as const,
        lat: point[1],
        lon: point[0],
      }));
  });

  const shapingPoints = segments.flatMap((segment) => {
    const kinds = ensureWaypointKinds(segment);
    return segment.waypoints
      .map((point, index) => ({
        point,
        kind: kinds[index] ?? "via",
        index,
      }))
      .filter((item) => item.kind === "shaping")
      .map(({ point, index }) => ({
        pointId: `${segment.id}-shp-${index}`,
        kind: "shaping" as const,
        lat: point[1],
        lon: point[0],
      }));
  });

  const geometryPts = trackPts.map(([lon, lat]) => ({ lat, lon }));
  const routeSegments = segments.map((segment, segmentIndex) => {
    const start = segments
      .slice(0, segmentIndex)
      .reduce(
        (sum, current) =>
          sum +
          (current.routePoints.length >= 2 && !current.routingFailed
            ? current.routePoints.length
            : 0),
        0,
      );
    const length =
      segment.routePoints.length >= 2 && !segment.routingFailed
        ? segment.routePoints.length
        : 0;
    const mode = parseRouteSegmentMode(
      segment.routeSegmentMode ??
        (segment.pathKind === "freehand"
          ? "MANUAL_STRAIGHT"
          : "FOLLOW_ROAD"),
    );
    return {
      segmentId: segment.id,
      name: segment.name,
      startIndex: start,
      endIndex: Math.max(start, start + Math.max(0, length - 1)),
      customColor: segment.color,
      pathKind: (segment.pathKind ??
        pathKindForSegmentMode(mode)) as
        | "routed"
        | "freehand"
        | "track"
        | "unknown",
      routeSegmentMode: mode,
      geometrySource:
        mode === "MANUAL_STRAIGHT" || segment.pathKind === "freehand"
          ? ("manual" as const)
          : segment.pathKind === "track"
            ? ("track" as const)
            : ("routed" as const),
      snapStatus: segment.routingFailed
        ? ("unmatched" as const)
        : ("matched" as const),
      cueIds: cues
        .filter((cue) => cue.segmentId === segment.id)
        .map((cue) => cue.cueId),
    };
  });

  return createEmptyRoute({
    routeId: `web-${segments[0]?.id ?? idFallback()}`,
    name: title,
    geometry: { points: geometryPts, segmentBreaks: [] },
    segments: routeSegments,
    viaPoints,
    shapingPoints,
    cues,
    styles: segments.map((segment) => ({
      styleId: `style-${segment.id}`,
      scope: "segment" as const,
      segmentId: segment.id,
      color: segment.color,
    })),
    offlineRequirements: {},
    metadata: { source: "web-route-studio" },
  });
}

export function exportGpx(
  segments: Segment[],
  title: string,
  cues: NavRideCue[] = [],
  capsule?: RouteCapsule | null,
): string {
  const points = segments.flatMap((segment) =>
    segment.routePoints.length >= 2 && !segment.routingFailed
      ? segment.routePoints
      : [],
  );
  const trackPoints = points.map(([lon, lat]) => ({ lat, lon }));
  const route = buildRouteJson(segments, title, cues, points);
  return exportGpxWithExtensions(route, title, trackPoints, capsule);
}

export function downloadOrSendGpx({
  segments,
  title,
  cues,
  capsule,
  embedNavRideApp,
}: {
  segments: Segment[];
  title: string;
  cues: NavRideCue[];
  capsule: RouteCapsule | null;
  embedNavRideApp: boolean;
}): void {
  const points = segments.flatMap((segment) =>
    segment.routePoints.length >= 2 && !segment.routingFailed
      ? segment.routePoints
      : [],
  );
  if (points.length < 2) return;

  const gpxXml = exportGpx(segments, title, cues, capsule);
  const route = buildRouteJson(segments, title, cues, points);
  const fileName = `${title.replace(/\s+/g, "_")}.gpx`;

  if (embedNavRideApp) {
    postToNavRideApp("EXPORT_GPX", {
      gpxXml,
      fileName,
      route: route as unknown as Record<string, unknown>,
    });
    return;
  }

  const blob = new Blob([gpxXml], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
