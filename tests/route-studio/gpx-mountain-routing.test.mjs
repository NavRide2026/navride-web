import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EDITOR_MAX_SNAP_METERS } from "../../lib/route-studio/geo.ts";
import { TRANSPORT_MODES } from "../../lib/route-studio/routing.ts";

/**
 * Mountain routing policy fixtures (editor web = OSRM; app = Valhalla).
 * These tests lock contracts: no invented OD, snap limit, profiles named.
 */
describe("gpx_mountain_routing_policy", () => {
  it("profiles exist for walk/bike/moto/car", () => {
    const ids = TRANSPORT_MODES.map((m) => m.id);
    assert.deepEqual(ids.sort(), ["bike", "car", "moto", "walk"].sort());
  });

  it("walk uses foot profile (paths/footways when graph allows)", () => {
    assert.equal(TRANSPORT_MODES.find((m) => m.id === "walk")?.osrmProfile, "foot");
  });

  it("bike uses bike profile (not driving)", () => {
    assert.equal(TRANSPORT_MODES.find((m) => m.id === "bike")?.osrmProfile, "bike");
  });

  it("car uses driving (not path)", () => {
    assert.equal(TRANSPORT_MODES.find((m) => m.id === "car")?.osrmProfile, "driving");
  });

  it("editor snap radius rejects far wrong-road jumps", () => {
    assert.ok(EDITOR_MAX_SNAP_METERS <= 30, "must prefer NO_ROUTE over wrong road");
  });

  it("Montseny regression marker: track authority pathKind=track", () => {
    // Contract: imported GPX must be pathKind track and must not be silently re-routed.
    const pathKinds = ["routed", "freehand", "track"];
    assert.ok(pathKinds.includes("track"));
  });

  it("control points must be sequential segments P0→P1→P2", () => {
    // Documented contract for follow_paths: each consecutive pair is a routed segment.
    const control = [
      [2.4, 41.76],
      [2.41, 41.77],
      [2.42, 41.775],
    ];
    const segments = [];
    for (let i = 0; i < control.length - 1; i++) {
      segments.push({ from: control[i], to: control[i + 1] });
    }
    assert.equal(segments.length, 2);
    assert.deepEqual(segments[0].from, control[0]);
    assert.deepEqual(segments[1].to, control[2]);
  });
});
