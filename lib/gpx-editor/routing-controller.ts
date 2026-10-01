import {
  routeWaypoints,
  detectAbsurdDetour,
  type TransportMode,
} from "@/lib/route-studio/routing";
import {
  DEFAULT_ROUTE_SEGMENT_MODE,
  geometryFingerprint,
  isRoutedSegmentMode,
  parseRouteSegmentMode,
  pathKindForSegmentMode,
  type RouteSegmentMode,
} from "@/lib/route-studio/segment-routing-mode";
import type { EditorMode } from "@/lib/route-studio/mode-capabilities";
import type { LngLat, Segment } from "./editor-types";

export async function routeForMode(
  waypoints: LngLat[],
  mode: TransportMode,
  segmentMode: RouteSegmentMode = DEFAULT_ROUTE_SEGMENT_MODE,
): Promise<{
  points: LngLat[];
  ok: boolean;
  message?: string;
  absurd?: boolean;
}> {
  if (segmentMode === "MANUAL_STRAIGHT") {
    return { points: [...waypoints], ok: true };
  }
  const result = await routeWaypoints(waypoints, mode, segmentMode);
  if (!result.ok) {
    return { points: [], ok: false, message: result.message };
  }
  const absurd = detectAbsurdDetour(waypoints, result.points);
  return {
    points: result.points,
    ok: true,
    absurd,
    message: absurd
      ? "Desvío absurdo detectado — revisa el waypoint o el modo de transporte."
      : undefined,
  };
}

export interface RoutingResult {
  segments: Segment[];
  error: string | null;
  stale: boolean;
}

export async function rerouteAllSegments({
  segments,
  mode,
  editorMode,
  generation,
  isCurrent,
}: {
  segments: Segment[];
  mode: TransportMode;
  editorMode: EditorMode;
  generation: number;
  isCurrent: (generation: number) => boolean;
}): Promise<RoutingResult> {
  const needsRouting = segments.some(
    (segment) =>
      segment.waypoints.length >= 2 &&
      isRoutedSegmentMode(
        parseRouteSegmentMode(
          segment.routeSegmentMode ??
            (segment.pathKind === "freehand"
              ? "MANUAL_STRAIGHT"
              : "FOLLOW_ROAD"),
        ),
      ) &&
      (segment.pathKind ?? "routed") !== "track",
  );
  if (!needsRouting) {
    return { segments, error: null, stale: false };
  }

  const next = [...segments];
  let error: string | null = null;
  for (let index = 0; index < next.length; index++) {
    const segment = next[index];
    if (segment.waypoints.length < 2) continue;
    const segmentMode = parseRouteSegmentMode(
      segment.routeSegmentMode ??
        (segment.pathKind === "freehand"
          ? "MANUAL_STRAIGHT"
          : "FOLLOW_ROAD"),
    );
    if (
      !isRoutedSegmentMode(segmentMode) ||
      (segment.pathKind ?? "routed") === "track"
    ) {
      continue;
    }

    const routed = await routeForMode(
      segment.waypoints,
      mode,
      segmentMode,
    );
    if (!isCurrent(generation)) {
      return { segments, error: null, stale: true };
    }

    next[index] = {
      ...segment,
      routePoints: routed.ok
        ? routed.points
        : segment.routePoints.length >= 2
          ? segment.routePoints
          : [],
      routingFailed: !routed.ok,
      absurdDetour: !!routed.absurd,
      routeSegmentMode: segmentMode,
      pathKind: pathKindForSegmentMode(segmentMode),
    };
    if (!routed.ok) {
      error =
        (routed.message ?? "Punto inalcanzable en el nuevo modo.") +
        " Sin geometría inventada.";
    } else if (routed.absurd && editorMode === "advanced") {
      error = routed.message ?? "Desvío absurdo tras cambiar modo.";
    }
  }

  return { segments: next, error, stale: !isCurrent(generation) };
}

export async function rerouteActiveSegment({
  segments,
  activeId,
  mode,
  transportMode,
  editorMode,
  generation,
  isCurrent,
}: {
  segments: Segment[];
  activeId: string;
  mode: RouteSegmentMode;
  transportMode: TransportMode;
  editorMode: EditorMode;
  generation: number;
  isCurrent: (generation: number) => boolean;
}): Promise<RoutingResult> {
  const index = segments.findIndex((segment) => segment.id === activeId);
  if (index < 0) {
    return { segments, error: null, stale: false };
  }
  const target = segments[index];
  if (target.pathKind === "track") {
    return {
      segments,
      error:
        "GPX importado: no se cambia el modo de un track autoritativo. Crea un segmento nuevo.",
      stale: false,
    };
  }

  const beforeFingerprints = segments.map((segment) =>
    geometryFingerprint(
      segment.routePoints.length >= 2
        ? segment.routePoints
        : segment.waypoints,
    ),
  );

  let routePoints = target.routePoints;
  let routingFailed = false;
  let absurdDetour = false;
  let error: string | null = null;

  if (mode === "MANUAL_STRAIGHT") {
    routePoints = [...target.waypoints];
  } else if (target.waypoints.length >= 2) {
    const routed = await routeForMode(
      target.waypoints,
      transportMode,
      mode,
    );
    if (!isCurrent(generation)) {
      return { segments, error: null, stale: true };
    }
    if (!routed.ok) {
      routePoints = [];
      routingFailed = true;
      error =
        (routed.message ?? "Sin ruta válida para este tramo.") +
        " No se usa recta falsa como éxito.";
    } else {
      routePoints = routed.points;
      absurdDetour = !!routed.absurd;
      if (routed.absurd && editorMode === "advanced") {
        error = routed.message ?? "Desvío absurdo detectado.";
      }
    }
  }

  const next = segments.map((segment, i) =>
    i === index
      ? {
          ...segment,
          routeSegmentMode: mode,
          pathKind: pathKindForSegmentMode(mode),
          routePoints,
          routingFailed,
          absurdDetour,
        }
      : segment,
  );

  for (let i = 0; i < next.length; i++) {
    if (i === index) continue;
    const after = geometryFingerprint(
      next[i].routePoints.length >= 2
        ? next[i].routePoints
        : next[i].waypoints,
    );
    if (after !== beforeFingerprints[i]) {
      return {
        segments,
        error:
          "ERROR interno: reroute parcial mutó otro tramo — abortado.",
        stale: false,
      };
    }
  }

  return { segments: next, error, stale: !isCurrent(generation) };
}
