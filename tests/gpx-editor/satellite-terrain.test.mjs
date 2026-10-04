import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { buildSatelliteStyleSync } from "../../lib/route-studio/satellite-style.ts";
import {
  SATELLITE_DEM_SOURCE_ID,
  SATELLITE_TERRAIN_EXAGGERATION,
  isSatelliteTerrainEnabled,
} from "../../lib/route-studio/satellite-terrain.ts";
import {
  cinematicCameraAltitudeM,
  cinematicPitchFromGrade,
} from "../../lib/gpx-editor/cinematic-camera-math.ts";
import { satelliteStyleHasTerrain } from "../../lib/gpx-editor/satellite-terrain-runtime.ts";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../..");

describe("satellite 3D terrain contracts", () => {
  it("satellite style contains terrarium raster-dem and terrain source", () => {
    const style = /** @type {any} */ (buildSatelliteStyleSync());
    assert.equal(isSatelliteTerrainEnabled(style), true);
    assert.equal(satelliteStyleHasTerrain(style), true);
    const dem = style.sources[SATELLITE_DEM_SOURCE_ID];
    assert.equal(dem.type, "raster-dem");
    assert.equal(dem.encoding, "terrarium");
    assert.match(dem.tiles[0], /\/api\/map-dem\/terrarium\//);
    assert.equal(style.terrain.source, SATELLITE_DEM_SOURCE_ID);
    assert.equal(style.terrain.exaggeration, SATELLITE_TERRAIN_EXAGGERATION);
    const hill = style.layers.find((layer) => layer.type === "hillshade");
    assert.ok(hill);
    assert.equal(hill.source, SATELLITE_DEM_SOURCE_ID);
  });

  it("useGpxMap restores terrain after style.load and disables it on 2D styles", () => {
    const hook = readFileSync(join(root, "lib/gpx-editor/useGpxMap.ts"), "utf8");
    assert.match(hook, /syncEditorTerrain\(map as never, snapshot\.styleId\)/);
    assert.match(
      hook,
      /syncEditorTerrain\(map as never, getSnapshotRef\.current\(\)\.styleId\)/,
    );
    const runtime = readFileSync(
      join(root, "lib/gpx-editor/satellite-terrain-runtime.ts"),
      "utf8",
    );
    assert.match(runtime, /styleId === "satellite"/);
    assert.match(runtime, /disableEditorTerrain/);
    assert.match(runtime, /setTerrain\(null\)/);
  });

  it("non-satellite editor styles do not declare terrain", () => {
    const editor = readFileSync(join(root, "lib/route-studio/editor-map-style.ts"), "utf8");
    assert.doesNotMatch(editor, /raster-dem/);
    assert.doesNotMatch(editor, /navride-terrain-dem/);
  });

  it("cinematic altitude stays finite with and without DEM", () => {
    const withDem = cinematicCameraAltitudeM(2200, 16.8, 0.12);
    const withoutDem = cinematicCameraAltitudeM(null, 16.8, 0);
    const missing = cinematicCameraAltitudeM(Number.NaN, 16.8, Number.POSITIVE_INFINITY);
    assert.ok(Number.isFinite(withDem));
    assert.ok(Number.isFinite(withoutDem));
    assert.ok(Number.isFinite(missing));
    assert.ok(withDem > withoutDem + 1500);
    const climb = cinematicPitchFromGrade(0.2);
    const descent = cinematicPitchFromGrade(-0.2);
    const flat = cinematicPitchFromGrade(0);
    assert.ok(climb < flat);
    assert.ok(descent > flat);
    assert.ok(Number.isFinite(climb) && Number.isFinite(descent));
  });
});
