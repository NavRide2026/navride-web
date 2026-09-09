import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_ROUTE_SEGMENT_MODE,
  geometryFingerprint,
  labelForSegmentMode,
  parseRouteSegmentMode,
  pathKindForSegmentMode,
  replaceSegmentModeAt,
  ROUTE_SEGMENT_MODES,
} from "../../lib/route-studio/segment-routing-mode.ts";
import { osrmProfileForSegment } from "../../lib/route-studio/routing.ts";

describe("segment-routing-mode", () => {
  it("user labels are Spanish product copy", () => {
    assert.equal(labelForSegmentMode("FOLLOW_ROAD"), "Seguir carretera");
    assert.equal(labelForSegmentMode("FOLLOW_TRAIL"), "Seguir caminos");
    assert.equal(labelForSegmentMode("MANUAL_STRAIGHT"), "Línea directa");
    for (const m of ROUTE_SEGMENT_MODES) {
      assert.equal(/valhalla|nrg1|hmm|edge|costing/i.test(m.label), false);
    }
  });

  it("legacy fallbacks are deterministic", () => {
    assert.equal(parseRouteSegmentMode(null), DEFAULT_ROUTE_SEGMENT_MODE);
    assert.equal(parseRouteSegmentMode("freehand"), "MANUAL_STRAIGHT");
    assert.equal(parseRouteSegmentMode("routed"), "FOLLOW_ROAD");
    assert.equal(pathKindForSegmentMode("MANUAL_STRAIGHT"), "freehand");
    assert.equal(pathKindForSegmentMode("FOLLOW_TRAIL"), "routed");
  });

  it("partial mode replace preserves other segments", () => {
    const segs = [
      { id: "a", routeSegmentMode: "FOLLOW_ROAD" },
      { id: "b", routeSegmentMode: "FOLLOW_ROAD" },
      { id: "c", routeSegmentMode: "FOLLOW_TRAIL" },
    ];
    const next = replaceSegmentModeAt(segs, 1, "MANUAL_STRAIGHT");
    assert.equal(next[0].routeSegmentMode, "FOLLOW_ROAD");
    assert.equal(next[1].routeSegmentMode, "MANUAL_STRAIGHT");
    assert.equal(next[2].routeSegmentMode, "FOLLOW_TRAIL");
    assert.equal(segs[1].routeSegmentMode, "FOLLOW_ROAD");
  });

  it("geometry fingerprint gate for A→B / C→D", () => {
    const ab = geometryFingerprint([
      [1.0, 42.0],
      [1.01, 42.01],
    ]);
    const cd = geometryFingerprint([
      [1.02, 42.02],
      [1.03, 42.03],
    ]);
    assert.equal(ab === cd, false);
    assert.equal(ab, geometryFingerprint([
      [1.0, 42.0],
      [1.01, 42.01],
    ]));
  });

  it("FOLLOW_TRAIL uses bike OSRM proxy for moto/car", () => {
    assert.equal(osrmProfileForSegment("moto", "FOLLOW_TRAIL"), "bike");
    assert.equal(osrmProfileForSegment("car", "FOLLOW_ROAD"), "driving");
    assert.equal(osrmProfileForSegment("walk", "FOLLOW_TRAIL"), "foot");
    assert.equal(osrmProfileForSegment("bike", "MANUAL_STRAIGHT"), "none");
  });
});
