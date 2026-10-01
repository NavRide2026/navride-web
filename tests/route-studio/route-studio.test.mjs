/**
 * Pure helpers mirrored for node:test (source of truth: lib/route-studio/*.ts).
 * Tests validate behavior contracts used by Editor de rutas.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ─── Inlined pure copies matching lib/route-studio ───────────────────────────

const ADVANCED_ONLY = [
  "waypoint_list",
  "waypoint_select",
  "waypoint_reorder",
  "waypoint_delete",
  "waypoint_insert",
  "track_width_opacity",
  "segment_name_edit",
  "transport_reroute_on_change",
  "route_health_details",
  "absurd_detour_handling",
  "via_shaping",
  "cues",
  "segment_split",
  "freehand_routed",
  "elevation_panel",
  "offline_pack_config",
  "import_gpx",
  "cuesheet",
];

const BASIC_CAPABILITIES = [
  "activity_mode",
  "locate",
  "add_points",
  "undo_redo",
  "save",
  "export",
];

function isAdvancedMode(mode) {
  return mode === "advanced";
}

function hasCapability(mode, capability) {
  if (BASIC_CAPABILITIES.includes(capability)) return true;
  return isAdvancedMode(mode);
}

function modesAreDistinct() {
  return ADVANCED_ONLY.every((c) => !BASIC_CAPABILITIES.includes(c));
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const la1 = (a[1] * Math.PI) / 180;
  const la2 = (b[1] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

function detectAbsurdDetour(waypoints, route) {
  if (waypoints.length < 2 || route.length < 2) return false;
  const direct = haversineKm(waypoints[0], waypoints[waypoints.length - 1]);
  let routeLen = 0;
  for (let i = 1; i < route.length; i++) {
    routeLen += haversineKm(route[i - 1], route[i]);
  }
  if (direct < 0.05) return false;
  return routeLen > direct * 4 && direct < 2;
}

function analyzeRouteHealth(segs) {
  const issues = [];
  const warnings = [];
  if (segs.every((s) => s.waypoints.length < 2 && s.routePoints.length < 2)) {
    return { health: "INVALID", issues: ["La ruta no tiene suficientes puntos."], warnings: [] };
  }
  for (const seg of segs) {
    if (seg.routingFailed) {
      issues.push(`Tramo sin ruta calculada en modo ${seg.mode}`);
    }
    const pts = seg.routePoints.length >= 2 ? seg.routePoints : seg.waypoints;
    if (pts.length >= 2 && seg.waypoints.length >= 2 && seg.routePoints.length === 0) {
      warnings.push("Waypoints sin geometría enrutada — revisa antes de guardar.");
    }
  }
  if (issues.length > 0) return { health: "INVALID", issues, warnings };
  if (warnings.length > 0) return { health: "REVIEW", issues, warnings };
  return { health: "GOOD", issues, warnings };
}

function serializeDraft(draft) {
  return JSON.stringify({ ...draft, savedAt: draft.savedAt || new Date().toISOString() });
}

function parseDraft(raw) {
  return JSON.parse(raw);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test("mode distinctness: advanced-only caps are not in basic", () => {
  assert.equal(modesAreDistinct(), true);
  assert.equal(hasCapability("simple", "save"), true);
  assert.equal(hasCapability("simple", "waypoint_delete"), false);
  assert.equal(hasCapability("advanced", "waypoint_delete"), true);
  assert.equal(hasCapability("advanced", "track_width_opacity"), true);
  assert.equal(hasCapability("simple", "absurd_detour_handling"), false);
});

test("mode-capabilities.ts exports ADVANCED_ONLY disjoint from BASIC", () => {
  const src = readFileSync(join(root, "lib/route-studio/mode-capabilities.ts"), "utf8");
  assert.match(src, /ADVANCED_ONLY/);
  assert.match(src, /BASIC_CAPABILITIES/);
  assert.match(src, /modesAreDistinct/);
  assert.match(src, /hasCapability/);
});

test("detectAbsurdDetour flags long winding vs short direct", () => {
  const wps = [
    [0, 0],
    [0.01, 0],
  ];
  // Direct ~1.1 km; absurd route zig-zag >> 4x
  const shortOk = [
    [0, 0],
    [0.005, 0],
    [0.01, 0],
  ];
  assert.equal(detectAbsurdDetour(wps, shortOk), false);

  const longDetour = [];
  for (let i = 0; i < 40; i++) {
    longDetour.push([0.0001 * i, i % 2 === 0 ? 0.02 : -0.02]);
  }
  longDetour.push([0.01, 0]);
  assert.equal(detectAbsurdDetour(wps, longDetour), true);
});

test("snapClickToRoute previews the Valhalla segment", () => {
  const src = readFileSync(join(root, "lib/route-studio/routing.ts"), "utf8");
  assert.match(src, /export async function snapClickToRoute/);
  assert.match(src, /routeWaypoints\(\[prev, click\], mode, segmentMode\)/);
  assert.match(src, /profile: `valhalla:/);
  assert.doesNotMatch(src, /nearestRoadPoint\(/);
  assert.match(src, /export function detectAbsurdDetour/);
  assert.match(src, /osrmProfile: "driving"/);
});

test("route-health: INVALID on routingFailed; GOOD on clean route", () => {
  const bad = analyzeRouteHealth([
    {
      waypoints: [
        [-3.7, 40.4],
        [-3.6, 40.5],
      ],
      routePoints: [],
      mode: "moto",
      routingFailed: true,
    },
  ]);
  assert.equal(bad.health, "INVALID");
  assert.ok(bad.issues.length >= 1);

  const good = analyzeRouteHealth([
    {
      waypoints: [
        [-3.7, 40.4],
        [-3.6, 40.5],
      ],
      routePoints: [
        [-3.7, 40.4],
        [-3.65, 40.45],
        [-3.6, 40.5],
      ],
      mode: "car",
      routingFailed: false,
    },
  ]);
  assert.equal(good.health, "GOOD");
});

test("route-health.ts exports analyzeRouteHealth", () => {
  const src = readFileSync(join(root, "lib/route-studio/route-health.ts"), "utf8");
  assert.match(src, /export function analyzeRouteHealth/);
});

test("autosave serialize/parse roundtrip + clearDraft API", () => {
  const draft = {
    savedAt: "2026-09-02T10:00:00.000Z",
    routeTitle: "Test",
    transportMode: "moto",
    editorMode: "advanced",
    segments: [{ id: "a", waypoints: [], routePoints: [], color: "#f97316", name: "S" }],
  };
  const raw = serializeDraft(draft);
  const back = parseDraft(raw);
  assert.equal(back.routeTitle, "Test");
  assert.equal(back.editorMode, "advanced");
  assert.ok(Array.isArray(back.segments));

  const src = readFileSync(join(root, "lib/route-studio/autosave.ts"), "utf8");
  assert.match(src, /export function saveDraft/);
  assert.match(src, /export function loadDraft/);
  assert.match(src, /export function clearDraft/);
  assert.match(src, /navride_route_studio_draft_v1/);
});

test("track-style and satellite-style modules present", () => {
  const track = readFileSync(join(root, "lib/route-studio/track-style.ts"), "utf8");
  assert.match(track, /HISTORY_CAP/);
  assert.match(track, /casingWidth/);
  assert.match(track, /ensureMinBrightness/);
  const sat = readFileSync(join(root, "lib/route-studio/satellite-style.ts"), "utf8");
  assert.match(sat, /buildSatelliteStyleSync/);
  assert.match(sat, /buildSatelliteStyleFromLiberty/);
  assert.match(sat, /openmaptiles|tiles\.openfreemap\.org/);
});

test("editor basemap pins OpenFreeMap source zoom and uses same-origin styles", () => {
  const style = readFileSync(
    join(root, "lib/route-studio/editor-map-style.ts"),
    "utf8",
  );
  assert.match(style, /OPENFREEMAP_VECTOR_SOURCE_URL/);
  assert.match(style, /OPENFREEMAP_PROXY_BASE/);
  assert.match(style, /proxyOpenFreeMapUrls/);
  assert.doesNotMatch(style, /World_Street_Map/);
  assert.doesNotMatch(style, /World_Topo_Map/);
  assert.doesNotMatch(style, /World_Light_Gray_Base/);
  assert.doesNotMatch(style, /navride-raster-base/);
  assert.doesNotMatch(style, /navride-transport-reference/);
  assert.doesNotMatch(style, /navride-places-reference/);
  assert.match(style, /maxzoom:\s*14/);
  assert.match(style, /transportation_name/);
  assert.match(style, /housenumber/);

  const editor = readFileSync(
    join(root, "components/gpx/GpxEditor.tsx"),
    "utf8",
  );
  assert.match(editor, /EDITOR_BASE_STYLE_URLS\.liberty/);
  assert.match(editor, /EDITOR_BASE_STYLE_URLS\.bright/);
  assert.match(editor, /EDITOR_BASE_STYLE_URLS\.positron/);
  assert.doesNotMatch(editor, /unpkg\.com\/maplibre-gl@5/);

  const styleRoute = readFileSync(
    join(root, "app/api/map-style/[style]/route.ts"),
    "utf8",
  );
  assert.match(styleRoute, /tiles\.openfreemap\.org\/styles\/\$\{style\}/);
  assert.match(styleRoute, /normalizeOpenFreeMapStyle/);

  const mapHook = readFileSync(
    join(root, "lib/gpx-editor/useGpxMap.ts"),
    "utf8",
  );
  assert.match(mapHook, /loadEditorStyle/);
  assert.match(mapHook, /setWorkerUrl/);
  assert.match(mapHook, /buildEditorFallbackStyle/);
  assert.match(mapHook, /EDITOR_BASE_STYLE_URLS/);
  assert.doesNotMatch(mapHook, /map\.on\("error"/);

  const satellite = readFileSync(
    join(root, "lib/route-studio/satellite-style.ts"),
    "utf8",
  );
  assert.match(satellite, /World_Imagery/);
  assert.match(satellite, /sat-road-casing/);
  assert.match(satellite, /"source-layer": "transportation"/);
  assert.match(satellite, /sat-highway-name/);
  assert.match(satellite, /sat-place-city/);

  const assetProxy = readFileSync(
    join(root, "app/api/map-assets/[...path]/route.ts"),
    "utf8",
  );
  assert.match(assetProxy, /OPENFREEMAP_UPSTREAM_ORIGIN/);
  assert.match(assetProxy, /proxyOpenFreeMapUrls/);
  assert.match(assetProxy, /X-NavRide-Map-Asset/);
});


test("editor canonical map exposes navigable road, trail and access layers", () => {
  const style = readFileSync(
    join(root, "lib/route-studio/editor-map-style.ts"),
    "utf8",
  );
  assert.match(style, /"nr-road"/);
  assert.match(style, /"nr-track"/);
  assert.match(style, /"nr-path"/);
  assert.match(style, /cycleway/);
  assert.match(style, /footway/);
  assert.match(style, /bridleway/);
  assert.match(style, /steps/);

  const adapter = readFileSync(
    join(root, "lib/gpx-editor/map-adapter.ts"),
    "utf8",
  );
  assert.match(adapter, /nav-access-restricted/);
  assert.match(adapter, /restrictionFilter/);
  assert.match(adapter, /#ef4444/);
  assert.match(adapter, /bicycle/);
  assert.match(adapter, /foot/);
  assert.match(adapter, /access/);
  assert.doesNotMatch(adapter, /"line-opacity": casingOpacity\([^\n]+\),\s*"line-cap"/);
});

test("editor + palette keep import mounted and tool wheel draggable", () => {
  const editor = readFileSync(
    join(root, "components/gpx/GpxEditor.tsx"),
    "utf8",
  );
  const palette = readFileSync(
    join(root, "components/gpx/GpxToolPalette.tsx"),
    "utf8",
  );
  assert.match(editor, /Always mounted: importing from the draggable/);
  assert.match(editor, /onExport=\{handleDownload\}/);
  assert.match(editor, /setSidebarCollapsed\(false\)/);
  assert.match(palette, /navride:gpx-tool-wheel-position-v1/);
  assert.match(palette, /setPointerCapture/);
  assert.match(palette, /onMainClick/);
  assert.match(palette, /Importar GPX/);
  assert.match(palette, /Exportar GPX/);
  assert.match(palette, /Mapas y capas/);
  assert.match(palette, /Marcar ruta/);
  assert.match(palette, /Enviar a NavRide App/);
  assert.match(palette, /Seguir carretera/);
  assert.match(palette, /Caminar/);
  assert.match(palette, /Nuevo segmento/);
  assert.match(editor, /Marcar ruta/);
  assert.match(editor, /if \(follow\) \{/);
  assert.match(editor, /onLaunch=\{\(\) => void handleLaunch\(\)\}/);
  assert.match(editor, /onTransportChange=\{handleTransportChange\}/);
});

test("NavRide web map keeps trail quality and access attributes visible", () => {
  const style = readFileSync(
    join(root, "lib/route-studio/editor-map-style.ts"),
    "utf8",
  );
  assert.match(style, /NAVRIDE_TRAIL_LAYER_IDS/);
  assert.match(style, /injectNavRideTrailLayers/);
  assert.match(style, /tracktype/);
  assert.match(style, /surface/);
  assert.match(style, /nr-access-restricted/);
  assert.match(style, /motor_vehicle/);
  assert.match(style, /motorcycle/);
  assert.match(style, /private/);
  assert.match(style, /minzoom:\s*9/);
  assert.match(style, /minzoom:\s*10/);
});



test("Spain map and routing authority can be pinned to one dataset id", () => {
  const styleRoute = readFileSync(
    join(root, "app/api/map-style/[style]/route.ts"),
    "utf8",
  );
  assert.match(styleRoute, /NAVRIDE_VECTOR_SOURCE_URL/);
  assert.match(styleRoute, /NAVRIDE_OSM_DATASET_ID/);
  assert.match(styleRoute, /spain-vector-v1/);

  const routingRoute = readFileSync(
    join(root, "app/api/gpx-routing/route.ts"),
    "utf8",
  );
  assert.match(routingRoute, /NAVRIDE_VALHALLA_URL/);
  assert.match(routingRoute, /NAVRIDE_OSM_DATASET_ID/);
  assert.match(routingRoute, /x-navride-dataset-id/);
  assert.match(routingRoute, /VALHALLA_DATASET_MISMATCH/);
  assert.match(routingRoute, /VALHALLA_DATASET_ID_MISSING/);
});



test("Spain E2E health gate requires identical vector and Valhalla dataset ids", () => {
  const health = readFileSync(
    join(root, "app/api/map-data-health/route.ts"),
    "utf8",
  );
  assert.match(health, /NAVRIDE_VECTOR_SOURCE_URL/);
  assert.match(health, /NAVRIDE_VALHALLA_URL/);
  assert.match(health, /NAVRIDE_OSM_DATASET_ID/);
  assert.match(health, /x-navride-dataset-id/);
  assert.match(health, /datasetMatch/);
  assert.match(health, /status: ready \? 200 : 503/);

  const mapRoute = readFileSync(
    join(root, "app/api/map-style/[style]/route.ts"),
    "utf8",
  );
  assert.match(mapRoute, /spain-vector-v1/);
  assert.match(mapRoute, /navride:dataset-id/);

  const routingRoute = readFileSync(
    join(root, "app/api/gpx-routing/route.ts"),
    "utf8",
  );
  assert.match(routingRoute, /VALHALLA_DATASET_MISMATCH/);
  assert.match(routingRoute, /VALHALLA_DATASET_ID_MISSING/);
});
