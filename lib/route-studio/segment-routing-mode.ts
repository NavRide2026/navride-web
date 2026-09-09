/**
 * Canonical segment routing modes — shared Web ↔ App wire names.
 * User-facing labels only; never expose Valhalla/NRG1/HMM/edge/costing.
 */

export type RouteSegmentMode =
  | "FOLLOW_ROAD"
  | "FOLLOW_TRAIL"
  | "MANUAL_STRAIGHT";

export const ROUTE_SEGMENT_MODES: {
  id: RouteSegmentMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "FOLLOW_ROAD",
    label: "Seguir carretera",
    hint: "Routing por red viaria. Sin ruta válida → error honesto (no recta falsa).",
  },
  {
    id: "FOLLOW_TRAIL",
    label: "Seguir caminos",
    hint: "Preferencia caminos/pistas con restricciones de acceso. No ignora prohibiciones.",
  },
  {
    id: "MANUAL_STRAIGHT",
    label: "Línea directa",
    hint: "Geometría directa entre puntos. Sin turn-by-turn de carretera.",
  },
];

export const DEFAULT_ROUTE_SEGMENT_MODE: RouteSegmentMode = "FOLLOW_ROAD";

export function parseRouteSegmentMode(raw: unknown): RouteSegmentMode {
  const s = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (s === "FOLLOW_TRAIL" || s === "TRAIL") return "FOLLOW_TRAIL";
  if (
    s === "MANUAL_STRAIGHT" ||
    s === "MANUAL" ||
    s === "STRAIGHT" ||
    s === "FREEHAND" ||
    s === "FREE_DRAW"
  ) {
    return "MANUAL_STRAIGHT";
  }
  if (s === "FOLLOW_ROAD" || s === "ROAD" || s === "FOLLOW_PATHS" || s === "ROUTED") {
    return "FOLLOW_ROAD";
  }
  // Legacy drawMode / pathKind fallbacks
  if (s === "FOLLOW_PATHS") return "FOLLOW_ROAD";
  if (s === "FREE_DRAW" || s === "FREEHAND") return "MANUAL_STRAIGHT";
  return DEFAULT_ROUTE_SEGMENT_MODE;
}

export function labelForSegmentMode(mode: RouteSegmentMode): string {
  return ROUTE_SEGMENT_MODES.find((m) => m.id === mode)?.label ?? mode;
}

export function pathKindForSegmentMode(
  mode: RouteSegmentMode,
): "routed" | "freehand" {
  return mode === "MANUAL_STRAIGHT" ? "freehand" : "routed";
}

export function isRoutedSegmentMode(mode: RouteSegmentMode): boolean {
  return mode !== "MANUAL_STRAIGHT";
}

/**
 * Partial mode change: only index `i` changes; others preserved by identity.
 */
export function replaceSegmentModeAt<T extends { routeSegmentMode?: RouteSegmentMode }>(
  segments: T[],
  index: number,
  mode: RouteSegmentMode,
): T[] {
  if (index < 0 || index >= segments.length) return segments;
  return segments.map((s, i) =>
    i === index ? { ...s, routeSegmentMode: mode } : s,
  );
}

/**
 * Geometry fingerprint for partial-reroute gate (A→B / C→D must stay equal).
 */
export function geometryFingerprint(
  pts: Array<[number, number]> | { lat: number; lon: number }[],
): string {
  return pts
    .map((p) => {
      if (Array.isArray(p)) return `${p[0].toFixed(6)},${p[1].toFixed(6)}`;
      return `${p.lon.toFixed(6)},${p.lat.toFixed(6)}`;
    })
    .join("|");
}
