/**
 * NavRideRoute MAX modules — codec roundtrip, recoverable parse, modes, via/shaping.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const {
  exportGpxWithExtensions,
  parseGpxFile,
  parseExtensionsXml,
} = await import("../../lib/route-studio/navride-route/gpx-codec.ts");

const {
  createEmptyRoute,
  parseNavRideRoute,
  POINT_KINDS,
  isViaOrShaping,
  toggleViaShaping,
  CUE_SEVERITIES,
} = await import("../../lib/route-studio/navride-route/types.ts");

const {
  modesAreDistinct,
  ADVANCED_ONLY,
  BASIC_CAPABILITIES,
  hasCapability,
} = await import("../../lib/route-studio/mode-capabilities.ts");

const { createCue, cueSeverityLabel } = await import("../../lib/route-studio/cues.ts");

const {
  createHistory,
  pushCommand,
  undo,
  redo,
  canUndo,
  HISTORY_CAP,
} = await import("../../lib/route-studio/navride-route/history.ts");

test("via/shaping kinds exist in types", () => {
  assert.ok(POINT_KINDS.includes("via"));
  assert.ok(POINT_KINDS.includes("shaping"));
  assert.equal(isViaOrShaping("via"), true);
  assert.equal(isViaOrShaping("shaping"), true);
  assert.equal(isViaOrShaping("poi"), false);
  assert.equal(toggleViaShaping("via"), "shaping");
  assert.equal(toggleViaShaping("shaping"), "via");
  const src = readFileSync(join(root, "lib/route-studio/navride-route/types.ts"), "utf8");
  assert.match(src, /viaPoints/);
  assert.match(src, /shapingPoints/);
  assert.match(src, /offlineRequirements/);
  assert.match(src, /NavRideCueSeverity/);
});

test("modesAreDistinct still true + ADVANCED_ONLY MAX caps", () => {
  assert.equal(modesAreDistinct(), true);
  assert.equal(hasCapability("simple", "export"), true);
  assert.equal(hasCapability("simple", "via_shaping"), false);
  assert.equal(hasCapability("advanced", "via_shaping"), true);
  assert.equal(hasCapability("advanced", "cues"), true);
  assert.equal(hasCapability("simple", "import_gpx"), false);
  for (const cap of [
    "via_shaping",
    "cues",
    "segment_split",
    "freehand_routed",
    "elevation_panel",
    "offline_pack_config",
    "import_gpx",
    "cuesheet",
  ]) {
    assert.ok(ADVANCED_ONLY.includes(cap), `missing ${cap}`);
    assert.ok(!BASIC_CAPABILITIES.includes(cap));
  }
});

test("GPX roundtrip preserves NavRideRoute extensions (no invented ele)", () => {
  const route = createEmptyRoute({
    routeId: "rt-roundtrip",
    name: "Test MAX",
    geometry: {
      points: [
        { lat: 40.4, lon: -3.7 },
        { lat: 40.41, lon: -3.69 },
      ],
      segmentBreaks: [],
    },
    segments: [
      {
        segmentId: "seg-0",
        startIndex: 0,
        endIndex: 1,
        pathKind: "routed",
        snapStatus: "matched",
      },
    ],
    viaPoints: [
      { pointId: "v1", kind: "via", lat: 40.4, lon: -3.7 },
    ],
    shapingPoints: [
      { pointId: "s1", kind: "shaping", lat: 40.405, lon: -3.695 },
    ],
    cues: [
      createCue({
        message: "Curva ciega",
        severity: "caution",
        progressM: 120,
      }),
    ],
    offlineRequirements: { corridorMode: "normal", needsMapVisual: true },
    styles: [{ styleId: "st-1", scope: "route", color: "#f97316" }],
  });

  const gpx = exportGpxWithExtensions(route, "Test MAX", [
    { lat: 40.4, lon: -3.7 },
    { lat: 40.41, lon: -3.69, ele: 612 },
  ]);

  assert.match(gpx, /xmlns:navride=/);
  assert.match(gpx, /<!\[CDATA\[/);
  assert.doesNotMatch(gpx, /<trkpt[^>]*>\s*<ele>0<\/ele>/);
  assert.match(gpx, /<ele>612<\/ele>/);
  // First point has no ele — omit tag
  assert.match(gpx, /trkpt lat="40\.4000000" lon="-3\.7000000"><\/trkpt>/);

  const parsed = parseGpxFile(gpx);
  assert.equal(parsed.recoverable, true);
  assert.ok(parsed.extensions);
  assert.equal(parsed.extensions.routeId, "rt-roundtrip");
  assert.equal(parsed.extensions.viaPoints?.length, 1);
  assert.equal(parsed.extensions.shapingPoints?.[0]?.kind, "shaping");
  assert.equal(parsed.extensions.cues?.[0]?.severity, "caution");
  assert.equal(parsed.extensions.offlineRequirements?.corridorMode, "normal");
  assert.equal(parsed.geometry.length, 2);
  assert.equal(parsed.geometry[1].ele, 612);
  assert.equal(parsed.geometry[0].ele, undefined);

  const again = exportGpxWithExtensions(parsed.extensions, parsed.extensions.name, [
    { lat: parsed.geometry[0].lat, lon: parsed.geometry[0].lon },
    {
      lat: parsed.geometry[1].lat,
      lon: parsed.geometry[1].lon,
      ele: parsed.geometry[1].ele,
    },
  ]);
  const twice = parseExtensionsXml(again);
  assert.ok(twice);
  assert.equal(twice.cues?.[0]?.message, "Curva ciega");
  assert.equal(twice.shapingPoints?.[0]?.pointId, "s1");
});

test("parse invalid/partial GPX is recoverable", () => {
  const partial = `<?xml version="1.0"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Broken</name><trkseg>
    <trkpt lat="40.1" lon="-3.1"></trkpt>
    <trkpt lat="40.2" lon="-3.2">
`;
  const r = parseGpxFile(partial);
  assert.equal(r.recoverable, true);
  assert.ok(r.geometry.length >= 1);
  assert.ok(r.issues.length >= 1);

  const empty = parseGpxFile("not xml at all");
  assert.equal(empty.recoverable, false);
  assert.ok(empty.issues.length >= 1);

  const junkExt = `<?xml version="1.0"?>
<gpx xmlns:navride="https://navride.app/ns/gpx/v1">
  <trk><trkseg>
    <trkpt lat="1" lon="2"></trkpt>
    <trkpt lat="3" lon="4"></trkpt>
  </trkseg></trk>
  <extensions><navride:route><![CDATA[{broken]]></navride:route></extensions>
</gpx>`;
  const j = parseGpxFile(junkExt);
  assert.equal(j.recoverable, true);
  assert.equal(j.extensions, null);
  assert.equal(j.geometry.length, 2);
});

test("cues helpers + severity labels ES", () => {
  assert.equal(cueSeverityLabel("danger"), "Peligro");
  assert.equal(cueSeverityLabel("info"), "Info");
  const c = createCue({ message: "Hola", severity: "attention", progressM: 10 });
  assert.equal(c.severity, "attention");
  assert.ok(CUE_SEVERITIES.includes(c.severity));
  assert.ok(c.cueId);
});

test("history command pattern cap 50", () => {
  let h = createHistory({ n: 0 });
  for (let i = 1; i <= 60; i++) {
    h = pushCommand(h, {
      type: i % 2 === 0 ? "ADD_POINT" : "MOVE_POINT",
      snapshot: { n: i },
    });
  }
  assert.ok(h.entries.length <= HISTORY_CAP);
  assert.equal(h.entries.length, HISTORY_CAP);
  assert.equal(canUndo(h), true);
  const u = undo(h);
  assert.equal(u.snapshot.n, 59);
  const r = redo(u.state);
  assert.equal(r.snapshot.n, 60);
});

test("parseNavRideRoute tolerates partial JSON", () => {
  const r = parseNavRideRoute({
    routeId: "x",
    name: "Y",
    geometry: { points: [{ lat: 1, lon: 2 }] },
    segments: [],
    viaPoints: [{ pointId: "a", kind: "via", lat: 1, lon: 2 }],
  });
  assert.ok(r);
  assert.equal(r.schemaVersion, 1);
  assert.equal(r.viaPoints?.length, 1);
});
