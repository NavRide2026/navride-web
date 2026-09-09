/**
 * Route Capsule v1 — mirrored from Lab app `route/canonical/*`.
 * `routeSchemaVersion` is the capsule envelope; NavRideRoute keeps schemaVersion 1.
 */

export const ROUTE_SCHEMA_VERSION = 2 as const;
/** Exp01 capsules remain readable. */
export const ROUTE_SCHEMA_VERSION_MIN = 1 as const;

export function routeSchemaReadable(v: number): boolean {
  return v >= ROUTE_SCHEMA_VERSION_MIN && v <= ROUTE_SCHEMA_VERSION;
}

export type RouteSourceType =
  | "ROUTER"
  | "IMPORTED_GPX"
  | "WEB_EDITOR"
  | "APP_EDITOR"
  | "CLOUD_SYNC"
  | "UNKNOWN";

export type RouteProvenance = {
  sourceType: RouteSourceType;
  sourceId?: string | null;
  sourceHash?: string | null;
  generatedAt: string;
  routerId?: string | null;
  routerVersion?: string | null;
  matcherVersion?: string | null;
  graphVersion?: string | null;
  mapVersion?: string | null;
  schemaVersion: number;
};

export type OriginalTrackMeta = {
  trackId: string;
  source: string;
  originalFileName?: string | null;
  originalFormat?: string;
  segmentBreaks?: number[];
  originalMetadata?: Record<string, unknown>;
  importedAt: string;
  contentHash: string;
};

export type DerivedRouteStub = {
  derivedRouteId: string;
  sourceTrackId: string;
  derivationMethod: string;
  createdAt: string;
  distanceM?: number | null;
  derivationConfidence?: number | null;
  matcherVersion?: string | null;
  graphVersion?: string | null;
  mapVersion?: string | null;
  matchedSegments?: unknown[];
  maneuvers?: unknown[];
  roadNames?: (string | null)[];
  roadClasses?: (string | null)[];
  accessAttributes?: Record<string, unknown>;
  [key: string]: unknown;
};

export type RouteCapsule = {
  routeSchemaVersion: number;
  capsuleId: string;
  originalTrack: OriginalTrackMeta;
  derivedRoute: DerivedRouteStub;
  canonicalRoute: {
    canonicalRouteId: string;
    name: string;
    provenance: RouteProvenance;
    sourceTrackId?: string | null;
    derivedRouteId?: string | null;
    metadata?: Record<string, unknown>;
  };
  provenance: RouteProvenance;
};

export function parseRouteCapsule(raw: unknown): RouteCapsule | null {
  if (!raw || typeof raw !== "object") return null;
  const j = raw as Record<string, unknown>;
  if (!j.capsuleId || !j.originalTrack || !j.provenance) return null;
  const ver =
    typeof j.routeSchemaVersion === "number" ? j.routeSchemaVersion : 1;
  if (!routeSchemaReadable(ver)) return null;
  return j as RouteCapsule;
}
