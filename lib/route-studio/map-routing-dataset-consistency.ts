/**
 * MapRoutingDatasetConsistency — diagnóstico editor/app.
 *
 * MapLibre/OpenFreeMap tiles pueden ser más recientes que el graph de routing
 * (OSRM público en web Route Studio; Valhalla/NRG tiles en app).
 *
 * Política:
 * - EDITOR_MAX_SNAP_METERS = 25
 * - Si snapDistanceMeters > max → NO_ROUTE_AT_CONTROL_POINT (no wrong-road)
 * - Ofrecer TRAZADO LIBRE
 *
 * Campos por click:
 * clickedLatLon, nearestGraphEdge, snapDistanceMeters, edgeId,
 * roadClass/use, access, surface, tracktype, graphDatasetVersion
 *
 * Web: OSRM no expone edgeId; se registra snapDistanceMeters + rejectedFar.
 * App: Valhalla locate cuando disponible.
 */
export type MapRoutingDatasetConsistencySample = {
  clickedLatLon: { lat: number; lon: number };
  snapDistanceMeters: number | null;
  rejectedFar: boolean;
  graphDatasetVersion: string;
  mapTileSource: string;
  routingEngine: "osrm-public" | "valhalla-local" | "unknown";
};

export const MAP_ROUTING_CONSISTENCY_NOTE =
  "Visual OSM tiles may be newer than routing graph; never invent geometry to hide gaps.";
