/**
 * Route Capsule / enriched GPX — web codec smoke tests (Lab Experiment 01).
 * Run: node --test tests/route-studio/route-capsule-gpx.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

const PLAIN = `<?xml version="1.0"?>
<gpx version="1.1" creator="x" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>Plain</name><trkseg>
    <trkpt lat="41.6" lon="0.6"></trkpt>
    <trkpt lat="41.61" lon="0.61"></trkpt>
  </trkseg></trk>
</gpx>`;

describe("route capsule contract constants", () => {
  it("ROUTE_SCHEMA_VERSION is 2 (v1 min readable) in route-capsule.ts", () => {
    const src = readFileSync(
      join(root, "lib/route-studio/navride-route/route-capsule.ts"),
      "utf8",
    );
    assert.match(src, /ROUTE_SCHEMA_VERSION\s*=\s*2/);
    assert.match(src, /ROUTE_SCHEMA_VERSION_MIN\s*=\s*1/);
  });

  it("gpx-codec exports capsule parse/export", () => {
    const src = readFileSync(
      join(root, "lib/route-studio/navride-route/gpx-codec.ts"),
      "utf8",
    );
    assert.match(src, /navride:capsule/);
    assert.match(src, /capsule\?: RouteCapsule/);
    assert.match(src, /parseCapsuleXml/);
    assert.match(src, /NAVRIDE_GPX_NS\s*=\s*"https:\/\/navride\.app\/ns\/gpx\/v1"/);
  });

  it("GpxEditor preserves capsuleRef on re-export", () => {
    const src = readFileSync(
      join(root, "components/gpx/GpxEditor.tsx"),
      "utf8",
    );
    assert.match(src, /capsuleRef/);
    assert.match(src, /exportGpx\([^)]*capsuleRef\.current/);
    assert.match(src, /parsed\.capsule/);
  });
});

describe("enriched GPX shape (static)", () => {
  it("export template includes both route and capsule extensions", () => {
    const src = readFileSync(
      join(root, "lib/route-studio/navride-route/gpx-codec.ts"),
      "utf8",
    );
    assert.ok(src.includes("<navride:route>"));
    assert.ok(src.includes("<navride:capsule>"));
    assert.ok(src.includes("trackPoints: undefined"));
  });

  it("plain GPX remains valid without extensions", () => {
    assert.ok(PLAIN.includes("<trkpt"));
    assert.ok(!PLAIN.includes("navride:"));
  });
});
