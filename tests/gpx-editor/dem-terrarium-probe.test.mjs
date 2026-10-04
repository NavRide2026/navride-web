/**
 * Isolated DEM probe without editor UI: AWS Terrarium tiles exist,
 * are PNG, and the style/runtime uses encoding=terrarium (MapLibre 6.11).
 *
 * Pixel decoding of PNG filters is MapLibre's job. This test proves the
 * data source is live and is not a pitched 2D raster pretending to be 3D.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSatelliteStyleSync } from "../../lib/route-studio/satellite-style.ts";
import { SATELLITE_DEM_SOURCE } from "../../lib/route-studio/satellite-terrain.ts";

const ANETO_TILE =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/10/513/377.png";
const MULHACEN_TILE =
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/10/502/398.png";

describe("AWS Terrarium DEM is a live independent source", () => {
  it("mountain tiles return PNG payloads and differ by region", async () => {
    const [aneto, mulhacen] = await Promise.all([
      fetch(ANETO_TILE, { signal: AbortSignal.timeout(20000) }),
      fetch(MULHACEN_TILE, { signal: AbortSignal.timeout(20000) }),
    ]);
    assert.equal(aneto.ok, true, `Aneto tile HTTP ${aneto.status}`);
    assert.equal(mulhacen.ok, true, `Mulhacen tile HTTP ${mulhacen.status}`);
    assert.match(aneto.headers.get("content-type") ?? "", /image\/png/);
    const a = Buffer.from(await aneto.arrayBuffer());
    const b = Buffer.from(await mulhacen.arrayBuffer());
    assert.equal(a[0], 0x89);
    assert.equal(a[1], 0x50);
    assert.ok(a.length > 20000);
    assert.ok(b.length > 20000);
    assert.notDeepEqual(a.subarray(0, 64), b.subarray(0, 64));
  });

  it("NavRide satellite DEM source uses terrarium encoding, not mapbox default", () => {
    assert.equal(SATELLITE_DEM_SOURCE.type, "raster-dem");
    assert.equal(SATELLITE_DEM_SOURCE.encoding, "terrarium");
    assert.equal(SATELLITE_DEM_SOURCE.maxzoom, 15);
    const style = /** @type {any} */ (buildSatelliteStyleSync());
    assert.equal(style.terrain.source, "navride-terrain-dem");
    assert.notEqual(style.terrain, undefined);
  });
});
