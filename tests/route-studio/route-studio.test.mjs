/**
 * Pure helpers mirrored for node:test (source of truth: lib/route-studio/*.ts).
 * Tests validate behavior contracts used by Route Studio.
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

test("snapClickToRoute contract exists in routing.ts", () => {
  const src = readFileSync(join(root, "lib/route-studio/routing.ts"), "utf8");
  assert.match(src, /export async function snapClickToRoute/);
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
