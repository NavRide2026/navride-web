/**
 * Canonical NavRideRoute v1 — mirrored from App contracts/navride_route.
 * schemaVersion is always 1.
 */

export const NAVRIDE_ROUTE_SCHEMA_VERSION = 1 as const;

export type NavRideRouteProfile =
  | "walk"
  | "bike"
  | "car"
  | "moto"
  | "offroad"
  | "mountain"
  | "unknown";

export type NavRidePointKind =
  | "start"
  | "end"
  | "via"
  | "shaping"
  | "cue"
  | "poi";

export type NavRidePathKind = "routed" | "freehand" | "track" | "unknown";

export type NavRideSnapStatus = "matched" | "unmatched" | "partial" | "unknown";

export type NavRideManeuverEvidence = "graph" | "valhalla" | "geometric" | "none";

export type NavRideCueSeverity = "info" | "attention" | "caution" | "danger";

export type NavRideCueActivation = "once" | "each_pass" | "range";

export type NavRideDirectionality = "forward" | "bidirectional" | "unknown";

export interface NavRideLatLon {
  lat: number;
  lon: number;
  ele?: number | null;
  name?: string | null;
}

export interface NavRideRoutePoint {
  pointId: string;
  kind: NavRidePointKind;
  lat: number;
  lon: number;
  name?: string | null;
  description?: string | null;
  progressM?: number | null;
  announce?: boolean;
}

export interface NavRideSegment {
  segmentId: string;
  startIndex: number;
  endIndex: number;
  name?: string | null;
  startProgressM?: number | null;
  endProgressM?: number | null;
  distanceM?: number | null;
  surface?: string | null;
  roadClass?: string | null;
  customColor?: string | null;
  profileOverride?: string | null;
  pathKind?: NavRidePathKind;
  snapStatus?: NavRideSnapStatus;
  cueIds?: string[];
}

export interface NavRideManeuver {
  maneuverId: string;
  kind: string;
  progressM: number;
  evidence: NavRideManeuverEvidence;
  instruction?: string | null;
  verbalAlert?: string | null;
  verbalPre?: string | null;
  verbalPost?: string | null;
  streetNames?: string[];
  confidence?: number;
}

/** User map note status — distinct from turn-by-turn maneuvers. */
export type NavRideNoteStatus = "on_track" | "off_track";

export interface NavRideCue {
  cueId: string;
  title: string;
  message: string;
  severity: NavRideCueSeverity;
  /** Along-track offset (m). Null when off-track / unknown. */
  progressM: number | null;
  /** Exact map click location — authority for marker placement. */
  lat?: number | null;
  lon?: number | null;
  noteStatus?: NavRideNoteStatus;
  nearestSegmentIndex?: number | null;
  projectionFraction?: number | null;
  category?: string;
  segmentId?: string | null;
  startProgressM?: number | null;
  endProgressM?: number | null;
  voiceEnabled?: boolean;
  beepEnabled?: boolean;
  directionality?: "forward" | "backward" | "both";
  validFrom?: string | null;
  validUntil?: string | null;
  activationPolicy?: NavRideCueActivation;
  creator?: string | null;
}

export interface NavRideStyle {
  styleId: string;
  scope: "route" | "segment";
  segmentId?: string | null;
  color?: string;
  width?: number | null;
  opacity?: number | null;
  [key: string]: unknown;
}

export interface NavRideOfflineRequirements {
  corridorMode?: "normal" | "wide" | "maximum" | "auto";
  needsMapVisual?: boolean;
  needsMatcherGraph?: boolean;
  needsValhallaTiles?: boolean;
  needsElevation?: boolean;
  estimatedBytes?: number | null;
  [key: string]: unknown;
}

export interface NavRideGeometry {
  points: NavRideLatLon[];
  segmentBreaks?: number[];
}

export interface NavRideRoute {
  schemaVersion: typeof NAVRIDE_ROUTE_SCHEMA_VERSION | 1;
  routeId: string;
  name: string;
  geometry: NavRideGeometry;
  segments: NavRideSegment[];
  description?: string | null;
  author?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  routeProfile?: NavRideRouteProfile;
  directionality?: NavRideDirectionality | string;
  routePoints?: NavRideRoutePoint[];
  viaPoints?: NavRideRoutePoint[];
  shapingPoints?: NavRideRoutePoint[];
  maneuvers?: NavRideManeuver[];
  cues?: NavRideCue[];
  styles?: NavRideStyle[];
  offlineRequirements?: NavRideOfflineRequirements;
  metadata?: Record<string, unknown>;
}

export const POINT_KINDS: readonly NavRidePointKind[] = [
  "start",
  "end",
  "via",
  "shaping",
  "cue",
  "poi",
] as const;

export const CUE_SEVERITIES: readonly NavRideCueSeverity[] = [
  "info",
  "attention",
  "caution",
  "danger",
] as const;

export function isViaOrShaping(kind: NavRidePointKind): boolean {
  return kind === "via" || kind === "shaping";
}

export function toggleViaShaping(kind: NavRidePointKind): "via" | "shaping" {
  return kind === "shaping" ? "via" : "shaping";
}

export function createEmptyRoute(
  partial?: Partial<NavRideRoute> & Pick<NavRideRoute, "routeId" | "name">,
): NavRideRoute {
  return {
    schemaVersion: NAVRIDE_ROUTE_SCHEMA_VERSION,
    routeId: partial?.routeId ?? `route-${Date.now()}`,
    name: partial?.name ?? "Ruta",
    geometry: partial?.geometry ?? { points: [], segmentBreaks: [] },
    segments: partial?.segments ?? [],
    description: partial?.description ?? null,
    author: partial?.author ?? null,
    createdAt: partial?.createdAt ?? null,
    updatedAt: partial?.updatedAt ?? null,
    routeProfile: partial?.routeProfile ?? "unknown",
    directionality: partial?.directionality ?? "forward",
    routePoints: partial?.routePoints ?? [],
    viaPoints: partial?.viaPoints ?? [],
    shapingPoints: partial?.shapingPoints ?? [],
    maneuvers: partial?.maneuvers ?? [],
    cues: partial?.cues ?? [],
    styles: partial?.styles ?? [],
    offlineRequirements: partial?.offlineRequirements ?? {},
    metadata: partial?.metadata ?? {},
  };
}

export function latLonToJson(p: NavRideLatLon): Record<string, unknown> {
  const out: Record<string, unknown> = { lat: p.lat, lon: p.lon };
  if (p.ele != null && Number.isFinite(p.ele)) out.ele = p.ele;
  if (p.name != null) out.name = p.name;
  return out;
}

export function routeToJson(route: NavRideRoute): Record<string, unknown> {
  return {
    schemaVersion: route.schemaVersion ?? NAVRIDE_ROUTE_SCHEMA_VERSION,
    routeId: route.routeId,
    name: route.name,
    ...(route.description != null ? { description: route.description } : {}),
    ...(route.author != null ? { author: route.author } : {}),
    ...(route.createdAt != null ? { createdAt: route.createdAt } : {}),
    ...(route.updatedAt != null ? { updatedAt: route.updatedAt } : {}),
    routeProfile: route.routeProfile ?? "unknown",
    directionality: route.directionality ?? "forward",
    geometry: {
      points: (route.geometry?.points ?? []).map(latLonToJson),
      segmentBreaks: route.geometry?.segmentBreaks ?? [],
    },
    segments: route.segments ?? [],
    routePoints: route.routePoints ?? [],
    viaPoints: route.viaPoints ?? [],
    shapingPoints: route.shapingPoints ?? [],
    maneuvers: route.maneuvers ?? [],
    cues: route.cues ?? [],
    styles: route.styles ?? [],
    offlineRequirements: route.offlineRequirements ?? {},
    metadata: route.metadata ?? {},
  };
}

function asNum(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function asStr(v: unknown, fallback = ""): string {
  return v == null ? fallback : String(v);
}

function parsePointKind(v: unknown): NavRidePointKind {
  const s = asStr(v);
  return (POINT_KINDS as readonly string[]).includes(s)
    ? (s as NavRidePointKind)
    : "poi";
}

function parseCueSeverity(v: unknown): NavRideCueSeverity {
  const s = asStr(v);
  return (CUE_SEVERITIES as readonly string[]).includes(s)
    ? (s as NavRideCueSeverity)
    : "info";
}

export function parseNavRideRoute(raw: unknown): NavRideRoute | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  const routeId = asStr(j.routeId);
  const name = asStr(j.name, "Ruta");
  if (!routeId && !name && !j.geometry) return null;

  const geoRaw =
    j.geometry && typeof j.geometry === "object"
      ? (j.geometry as Record<string, unknown>)
      : {};
  const pointsRaw = Array.isArray(geoRaw.points) ? geoRaw.points : [];
  const points: NavRideLatLon[] = pointsRaw
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => {
      const pt: NavRideLatLon = {
        lat: asNum(p.lat),
        lon: asNum(p.lon),
      };
      if (p.ele != null && Number.isFinite(Number(p.ele))) {
        pt.ele = Number(p.ele);
      }
      if (typeof p.name === "string") pt.name = p.name;
      return pt;
    });

  const segmentBreaks = Array.isArray(geoRaw.segmentBreaks)
    ? geoRaw.segmentBreaks.map((b) => asNum(b)).filter((n) => n >= 0)
    : [];

  const mapRoutePoint = (p: Record<string, unknown>): NavRideRoutePoint => ({
    pointId: asStr(p.pointId, `pt-${Math.random().toString(36).slice(2, 7)}`),
    kind: parsePointKind(p.kind),
    lat: asNum(p.lat),
    lon: asNum(p.lon),
    name: typeof p.name === "string" ? p.name : null,
    description: typeof p.description === "string" ? p.description : null,
    progressM: p.progressM == null ? null : asNum(p.progressM),
    announce: p.announce === true,
  });

  const listMap = <T>(
    arr: unknown,
    fn: (x: Record<string, unknown>) => T,
  ): T[] =>
    Array.isArray(arr)
      ? arr
          .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
          .map(fn)
      : [];

  return {
    schemaVersion: 1,
    routeId: routeId || `route-${Date.now()}`,
    name,
    description: typeof j.description === "string" ? j.description : null,
    author: typeof j.author === "string" ? j.author : null,
    createdAt: typeof j.createdAt === "string" ? j.createdAt : null,
    updatedAt: typeof j.updatedAt === "string" ? j.updatedAt : null,
    routeProfile: (asStr(j.routeProfile, "unknown") as NavRideRouteProfile) || "unknown",
    directionality: asStr(j.directionality, "forward"),
    geometry: { points, segmentBreaks },
    segments: listMap(j.segments, (s) => ({
      segmentId: asStr(s.segmentId, "seg-0"),
      name: typeof s.name === "string" ? s.name : null,
      startIndex: asNum(s.startIndex),
      endIndex: asNum(s.endIndex),
      startProgressM: s.startProgressM == null ? null : asNum(s.startProgressM),
      endProgressM: s.endProgressM == null ? null : asNum(s.endProgressM),
      distanceM: s.distanceM == null ? null : asNum(s.distanceM),
      surface: typeof s.surface === "string" ? s.surface : null,
      roadClass: typeof s.roadClass === "string" ? s.roadClass : null,
      customColor: typeof s.customColor === "string" ? s.customColor : null,
      profileOverride:
        typeof s.profileOverride === "string" ? s.profileOverride : null,
      pathKind: (asStr(s.pathKind, "unknown") as NavRidePathKind) || "unknown",
      snapStatus:
        (asStr(s.snapStatus, "unknown") as NavRideSnapStatus) || "unknown",
      cueIds: Array.isArray(s.cueIds) ? s.cueIds.map((c) => String(c)) : [],
    })),
    routePoints: listMap(j.routePoints, mapRoutePoint),
    viaPoints: listMap(j.viaPoints, mapRoutePoint),
    shapingPoints: listMap(j.shapingPoints, mapRoutePoint),
    maneuvers: listMap(j.maneuvers, (m) => ({
      maneuverId: asStr(m.maneuverId),
      kind: asStr(m.kind),
      progressM: asNum(m.progressM),
      evidence:
        (asStr(m.evidence, "none") as NavRideManeuverEvidence) || "none",
      instruction: typeof m.instruction === "string" ? m.instruction : null,
      verbalAlert: typeof m.verbalAlert === "string" ? m.verbalAlert : null,
      verbalPre: typeof m.verbalPre === "string" ? m.verbalPre : null,
      verbalPost: typeof m.verbalPost === "string" ? m.verbalPost : null,
      streetNames: Array.isArray(m.streetNames)
        ? m.streetNames.map((s) => String(s))
        : [],
      confidence: asNum(m.confidence),
    })),
    cues: listMap(j.cues, (c) => ({
      cueId: asStr(c.cueId),
      title: asStr(c.title),
      message: asStr(c.message),
      category: asStr(c.category, "note"),
      severity: parseCueSeverity(c.severity),
      progressM: c.progressM == null ? null : asNum(c.progressM),
      lat: c.lat == null ? null : asNum(c.lat),
      lon: c.lon == null ? null : asNum(c.lon),
      noteStatus:
        c.noteStatus === "off_track" ? ("off_track" as const) : ("on_track" as const),
      nearestSegmentIndex:
        c.nearestSegmentIndex == null ? null : asNum(c.nearestSegmentIndex),
      projectionFraction:
        c.projectionFraction == null ? null : asNum(c.projectionFraction),
      segmentId: typeof c.segmentId === "string" ? c.segmentId : null,
      startProgressM: c.startProgressM == null ? null : asNum(c.startProgressM),
      endProgressM: c.endProgressM == null ? null : asNum(c.endProgressM),
      voiceEnabled: c.voiceEnabled !== false,
      beepEnabled: c.beepEnabled !== false,
      directionality: asStr(c.directionality, "forward") as
        | "forward"
        | "backward"
        | "both",
      validFrom: typeof c.validFrom === "string" ? c.validFrom : null,
      validUntil: typeof c.validUntil === "string" ? c.validUntil : null,
      activationPolicy: (asStr(c.activationPolicy, "once") as NavRideCueActivation) || "once",
      creator: typeof c.creator === "string" ? c.creator : null,
    })),
    styles: listMap(j.styles, (s) => ({
      styleId: asStr(s.styleId, "style-0"),
      scope: s.scope === "segment" ? "segment" : "route",
      segmentId: typeof s.segmentId === "string" ? s.segmentId : null,
      color: typeof s.color === "string" ? s.color : undefined,
      width: s.width == null ? null : asNum(s.width),
      opacity: s.opacity == null ? null : asNum(s.opacity),
    })),
    offlineRequirements:
      j.offlineRequirements && typeof j.offlineRequirements === "object"
        ? (j.offlineRequirements as NavRideOfflineRequirements)
        : {},
    metadata:
      j.metadata && typeof j.metadata === "object"
        ? (j.metadata as Record<string, unknown>)
        : {},
  };
}

export function maneuverDisplayInstruction(m: NavRideManeuver): string {
  const conf = m.confidence ?? 0;
  if (m.evidence === "none" || conf < 0.45) {
    return "Continúa siguiendo la ruta";
  }
  if (m.evidence === "geometric") {
    return m.instruction ?? "Continúa siguiendo la ruta";
  }
  return m.verbalPre ?? m.instruction ?? "Continúa siguiendo la ruta";
}
