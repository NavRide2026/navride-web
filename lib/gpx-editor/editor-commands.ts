import { ensureMinBrightness } from "@/lib/route-studio/track-style";
import type { LngLat, Segment, WaypointKind } from "./editor-types";

function waypointKinds(segment: Segment): WaypointKind[] {
  const kinds = segment.waypointKinds ? [...segment.waypointKinds] : [];
  while (kinds.length < segment.waypoints.length) kinds.push("via");
  return kinds.slice(0, segment.waypoints.length);
}

export function clearActiveSegment(
  segments: Segment[],
  activeId: string,
): Segment[] {
  return segments.map((segment) =>
    segment.id !== activeId
      ? segment
      : {
          ...segment,
          waypoints: [],
          waypointKinds: [],
          routePoints: [],
          routingFailed: false,
          absurdDetour: false,
        },
  );
}

export function closeLoopWaypoints(segment: Segment): {
  waypoints: LngLat[];
  kinds: WaypointKind[];
} | null {
  if (segment.waypoints.length < 3) return null;
  return {
    waypoints: [...segment.waypoints, segment.waypoints[0]],
    kinds: [...waypointKinds(segment), "via"],
  };
}

export function appendSegment(
  segments: Segment[],
  segment: Segment,
): Segment[] {
  return [...segments, segment];
}

export function deleteSegment(
  segments: Segment[],
  segmentId: string,
  fallback: () => Segment,
): Segment[] {
  const next = segments.filter((segment) => segment.id !== segmentId);
  return next.length === 0 ? [fallback()] : next;
}

export function recolorSegment(
  segments: Segment[],
  segmentId: string,
  color: string,
): Segment[] {
  const safe = ensureMinBrightness(color);
  return segments.map((segment) =>
    segment.id === segmentId ? { ...segment, color: safe } : segment,
  );
}

export function renameSegment(
  segments: Segment[],
  segmentId: string,
  name: string,
): Segment[] {
  return segments.map((segment) =>
    segment.id === segmentId ? { ...segment, name } : segment,
  );
}

export function removeWaypoint(
  segments: Segment[],
  segmentId: string,
  index: number,
): Segment[] {
  return segments.map((segment) => {
    if (segment.id !== segmentId) return segment;
    const waypoints = segment.waypoints.filter((_, i) => i !== index);
    const kinds = waypointKinds(segment).filter((_, i) => i !== index);
    return {
      ...segment,
      waypoints,
      waypointKinds: kinds,
      routePoints: waypoints.length < 2 ? [] : segment.routePoints,
    };
  });
}

export function reorderWaypoint(
  segments: Segment[],
  segmentId: string,
  index: number,
  direction: -1 | 1,
): { segments: Segment[]; nextIndex: number } | null {
  const target = index + direction;
  const source = segments.find((segment) => segment.id === segmentId);
  if (!source || target < 0 || target >= source.waypoints.length) {
    return null;
  }
  const next = segments.map((segment) => {
    if (segment.id !== segmentId) return segment;
    const waypoints = [...segment.waypoints];
    const kinds = waypointKinds(segment);
    [waypoints[index], waypoints[target]] = [
      waypoints[target],
      waypoints[index],
    ];
    [kinds[index], kinds[target]] = [kinds[target], kinds[index]];
    return { ...segment, waypoints, waypointKinds: kinds };
  });
  return { segments: next, nextIndex: target };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** Split one segment into two at waypoint index (index becomes end of first). */
export function splitSegmentAt(
  segments: Segment[],
  segmentId: string,
  waypointIndex: number,
): Segment[] | null {
  const source = segments.find((segment) => segment.id === segmentId);
  if (!source) return null;
  if (waypointIndex <= 0 || waypointIndex >= source.waypoints.length - 1) {
    return null;
  }
  const kinds = waypointKinds(source);
  const left: Segment = {
    ...source,
    id: source.id,
    name: `${source.name} A`,
    waypoints: source.waypoints.slice(0, waypointIndex + 1),
    waypointKinds: kinds.slice(0, waypointIndex + 1),
    routePoints: [],
    routingFailed: false,
    absurdDetour: false,
  };
  const right: Segment = {
    ...source,
    id: uid(),
    name: `${source.name} B`,
    waypoints: source.waypoints.slice(waypointIndex),
    waypointKinds: kinds.slice(waypointIndex),
    routePoints: [],
    routingFailed: false,
    absurdDetour: false,
  };
  const idx = segments.findIndex((segment) => segment.id === segmentId);
  const next = [...segments];
  next.splice(idx, 1, left, right);
  return next;
}

/** Join segment with the next one in the list (shared endpoint deduped). */
export function joinWithNextSegment(
  segments: Segment[],
  segmentId: string,
): Segment[] | null {
  const idx = segments.findIndex((segment) => segment.id === segmentId);
  if (idx < 0 || idx >= segments.length - 1) return null;
  const a = segments[idx];
  const b = segments[idx + 1];
  const aKinds = waypointKinds(a);
  const bKinds = waypointKinds(b);
  let bWaypoints = [...b.waypoints];
  let bK = [...bKinds];
  if (
    a.waypoints.length > 0 &&
    b.waypoints.length > 0 &&
    Math.abs(a.waypoints[a.waypoints.length - 1][0] - b.waypoints[0][0]) < 1e-7 &&
    Math.abs(a.waypoints[a.waypoints.length - 1][1] - b.waypoints[0][1]) < 1e-7
  ) {
    bWaypoints = bWaypoints.slice(1);
    bK = bK.slice(1);
  }
  const merged: Segment = {
    ...a,
    name: a.name === b.name ? a.name : `${a.name}+${b.name}`,
    waypoints: [...a.waypoints, ...bWaypoints],
    waypointKinds: [...aKinds, ...bK],
    routePoints: [],
    routingFailed: false,
    absurdDetour: false,
    pathKind: a.pathKind === "track" || b.pathKind === "track" ? "track" : a.pathKind,
  };
  const next = [...segments];
  next.splice(idx, 2, merged);
  return next;
}

/** Reverse all segments and waypoints/kinds/routePoints within each. */
export function reverseRoute(segments: Segment[]): Segment[] {
  return [...segments].reverse().map((segment) => ({
    ...segment,
    waypoints: [...segment.waypoints].reverse(),
    waypointKinds: waypointKinds(segment).reverse(),
    routePoints: [...segment.routePoints].reverse(),
  }));
}
