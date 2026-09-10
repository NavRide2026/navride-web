import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  reverseLngLats,
  roundTripLngLats,
  rotateLoopStart,
  replaceSpan,
  isStaleGeneration,
  isClosedLngLats,
} from "../../lib/route-studio/gpx-route-ops.ts";
import {
  classifyPoiTags,
  dedupPois,
  overpassPoiQuery,
  PoiTileStore,
  poiTileKey,
} from "../../lib/route-studio/navride-poi.ts";
import { classifyWay } from "../../lib/route-studio/route-compatibility.ts";

const here = dirname(fileURLToPath(import.meta.url));

describe("gpx route ops", () => {
  const pts = [
    [-3.7058, 40.4203],
    [-3.7040, 40.4210],
    [-3.7020, 40.4220],
  ];

  it("reverse / round trip / rotate loop / replace span / latest-wins", () => {
    const rev = reverseLngLats(pts);
    assert.deepEqual(rev[0], pts[2]);
    const rt = roundTripLngLats(pts);
    assert.equal(rt.length, 5);
    assert.deepEqual(rt[rt.length - 1], pts[0]);
    const loop = [...pts, pts[0]];
    assert.equal(isClosedLngLats(loop), true);
    const rotated = rotateLoopStart(loop, 1);
    assert.deepEqual(rotated[0], pts[1]);
    const edited = replaceSpan(pts, 1, 1, [[-3.703, 40.4215]]);
    assert.equal(edited.length, 3);
    assert.equal(edited[1][0], -3.703);
    assert.equal(isStaleGeneration(1, 2), true);
    assert.equal(isStaleGeneration(4, 4), false);
  });
});

describe("poi cache / dedup / stale / categories", () => {
  it("query only travel categories", () => {
    const q = overpassPoiQuery(["fuel", "parking"], 40.4, -3.72, 40.43, -3.69);
    assert.match(q, /fuel/);
    assert.match(q, /parking/);
    assert.doesNotMatch(q, /attraction/);
    assert.doesNotMatch(q, /cemetery/);
  });

  it("dedup and classify", () => {
    const a = { id: "a", lat: 40.42, lon: -3.70, category: "fuel", osmId: 1 };
    const b = { id: "b", lat: 40.42, lon: -3.70, category: "fuel", osmId: 1 };
    assert.equal(dedupPois([a, b]).length, 1);
    assert.equal(classifyPoiTags({ amenity: "fuel" }), "fuel");
    assert.equal(classifyPoiTags({ tourism: "attraction" }), null);
  });

  it("stale generation discarded", () => {
    const store = new PoiTileStore();
    const g1 = store.bump();
    store.put(poiTileKey(40.42, -3.70), [{ id: "n", lat: 40.42, lon: -3.7, category: "fuel" }], g1);
    store.bump();
    assert.equal(store.isStale(g1), true);
    assert.equal(store.getIfCurrent(poiTileKey(40.42, -3.70), store.generation), null);
  });
});

describe("app/web same compatibility", () => {
  it("moto gravel track allowed, motorcycle=no forbidden, path known", () => {
    assert.equal(classifyWay({ highway: "track", surface: "gravel" }, "moto").cls, "COMPATIBLE");
    assert.equal(classifyWay({ highway: "residential", motorcycle: "no" }, "moto").cls, "INCOMPATIBLE");
    assert.equal(classifyWay({ highway: "path" }, "moto").cls, "INCOMPATIBLE");
    assert.equal(classifyWay({ highway: "primary" }, "car").cls, "COMPATIBLE");
    assert.equal(classifyWay({ highway: "cycleway" }, "bike").cls, "COMPATIBLE");
    assert.equal(classifyWay({ highway: "footway", foot: "yes" }, "walk").cls, "COMPATIBLE");
  });
});

describe("editor tools wired without cloning gpx.studio chrome", () => {
  it("exposes invert / round trip / back to start in the existing panel", () => {
    const src = readFileSync(join(here, "../../components/gpx/GpxEditor.tsx"), "utf8");
    assert.match(src, /Invertir/);
    assert.match(src, /Ida y vuelta/);
    assert.match(src, /Volver al inicio/);
    assert.match(src, /Cerrar circuito/);
    assert.match(src, /Puntos de interés/);
    assert.doesNotMatch(src, /gpx\.studio/);
    assert.doesNotMatch(src, /graphhopper\.gpx\.studio/i);
  });
});
