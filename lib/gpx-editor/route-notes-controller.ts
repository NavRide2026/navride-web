import {
  cueSeverityLabel,
} from "@/lib/route-studio/cues";
import {
  toggleViaShaping,
  type NavRideCue,
  type NavRideCueSeverity,
} from "@/lib/route-studio/navride-route/types";
import type { Segment, WaypointKind } from "./editor-types";

function waypointKinds(segment: Segment): WaypointKind[] {
  const kinds = segment.waypointKinds ? [...segment.waypointKinds] : [];
  while (kinds.length < segment.waypoints.length) kinds.push("via");
  return kinds.slice(0, segment.waypoints.length);
}

export function toggleWaypointViaShaping(
  segments: Segment[],
  segmentId: string,
  index: number,
): Segment[] {
  return segments.map((segment) => {
    if (segment.id !== segmentId) return segment;
    const kinds = waypointKinds(segment);
    kinds[index] = toggleViaShaping(kinds[index] ?? "via");
    return { ...segment, waypointKinds: kinds };
  });
}

export function cuePlacementMessage(message: string): {
  ok: boolean;
  error: string | null;
} {
  if (!message.trim()) return { ok: false, error: null };
  return {
    ok: true,
    error: "Pulsa en el mapa para colocar la nota exactamente ahí.",
  };
}

export function deleteCue(
  cues: NavRideCue[],
  cueId: string,
): NavRideCue[] {
  return cues.filter((cue) => cue.cueId !== cueId);
}

export function updateCueSeverity(
  cues: NavRideCue[],
  cueId: string,
  severity: NavRideCueSeverity,
): NavRideCue[] {
  return cues.map((cue) =>
    cue.cueId === cueId
      ? {
          ...cue,
          severity,
          title: cueSeverityLabel(severity),
        }
      : cue,
  );
}
