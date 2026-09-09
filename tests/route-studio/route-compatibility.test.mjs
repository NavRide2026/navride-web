import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyWay } from "../../lib/route-studio/route-compatibility.ts";
import {
  decideEditorSnap,
  rankWaysNearClick,
} from "../../lib/route-studio/route-compatibility-snap.ts";
import { auditRouteGeometry } from "../../lib/route-studio/route-compatibility-audit.ts";

describe("route compatibility motorcycle", () => {
  it("does not ignore motorcycle=no on a residential street", () => {
    const r = classifyWay(
      { highway: "residential", motorcycle: "no" },
      "moto",
    );
    assert.equal(r.cls, "INCOMPATIBLE");
    assert.equal(r.explicitRestriction, true);
  });

  it("treats footway as incompatible for moto with a reason", () => {
    const r = classifyWay({ highway: "footway" }, "moto");
    assert.equal(r.cls, "INCOMPATIBLE");
    assert.match(r.reason.toLowerCase(), /peatonal|sendero|motor/);
  });

  it("does not treat gravel track as forbidden", () => {
    const r = classifyWay({ highway: "track", surface: "gravel" }, "moto");
    assert.equal(r.cls, "COMPATIBLE");
  });

  it("marks private as restricted", () => {
    const r = classifyWay({ highway: "service", access: "private" }, "moto");
    assert.equal(r.cls, "RESTRICTED");
  });

  it("does not treat UNKNOWN as compatible", () => {
    const r = classifyWay({}, "moto");
    assert.equal(r.cls, "UNKNOWN");
  });

  it("treats vehicle=no and access=no as incompatible for moto", () => {
    assert.equal(
      classifyWay({ highway: "track", vehicle: "no" }, "moto").cls,
      "INCOMPATIBLE",
    );
    assert.equal(
      classifyWay({ highway: "residential", access: "no" }, "moto").cls,
      "INCOMPATIBLE",
    );
  });

  it("treats motor_vehicle=no as incompatible for moto", () => {
    assert.equal(
      classifyWay({ highway: "track", motor_vehicle: "no" }, "moto").cls,
      "INCOMPATIBLE",
    );
  });

  it("treats destination as restricted, not silently allowed", () => {
    const r = classifyWay({ highway: "service", access: "destination" }, "moto");
    assert.equal(r.cls, "RESTRICTED");
  });

  it("treats cycleway and steps as incompatible for moto", () => {
    assert.equal(classifyWay({ highway: "cycleway" }, "moto").cls, "INCOMPATIBLE");
    assert.equal(classifyWay({ highway: "steps" }, "moto").cls, "INCOMPATIBLE");
  });

  it("treats corridor as incompatible for moto", () => {
    assert.equal(classifyWay({ highway: "corridor" }, "moto").cls, "INCOMPATIBLE");
  });

  it("treats motorroad as incompatible for bicycle", () => {
    assert.equal(
      classifyWay({ highway: "primary", motorroad: "yes" }, "bike").cls,
      "INCOMPATIBLE",
    );
  });

  it("does not ignore access:motorcycle=no", () => {
    const r = classifyWay(
      { highway: "residential", "access:motorcycle": "no" },
      "moto",
    );
    assert.equal(r.cls, "INCOMPATIBLE");
    assert.equal(r.explicitRestriction, true);
  });
});

describe("smart snap", () => {
  const foot = {
    id: 1,
    tags: { highway: "footway" },
    geometry: [
      [2.0, 41.0],
      [2.00004, 41.0],
    ],
  };
  const track = {
    id: 2,
    tags: { highway: "track", surface: "gravel" },
    geometry: [
      [2.00006, 41.0],
      [2.0001, 41.0],
    ],
  };

  it("prefers nearby compatible track over closer footway", () => {
    const click = [2.000045, 41.0];
    const hits = rankWaysNearClick(click, [foot, track], "moto", 25);
    const decision = decideEditorSnap(click, hits);
    assert.equal(decision.kind, "place");
    if (decision.kind === "place") {
      assert.equal(decision.hit?.way.id, 2);
    }
  });

  it("prompts when the click is clearly on an incompatible way far from alternatives", () => {
    const far = {
      id: 9,
      tags: { highway: "track" },
      geometry: [
        [2.003, 41.0],
        [2.004, 41.0],
      ],
    };
    const click = [2.00002, 41.0];
    const hits = rankWaysNearClick(click, [foot, far], "moto", 400);
    const near = hits.filter((h) => h.distanceM <= 25);
    const decision = decideEditorSnap(click, near.length ? near : hits.slice(0, 1));
    assert.equal(decision.kind, "prompt");
  });
});

describe("route audit", () => {
  it("flags an incompatible span and keeps km", () => {
    const pts = [
      [2.0, 41.0],
      [2.001, 41.0],
    ];
    const way = {
      id: 3,
      tags: { highway: "footway" },
      geometry: [
        [2.0, 41.0],
        [2.001, 41.0],
      ],
    };
    const audit = auditRouteGeometry(pts, [way], "moto");
    assert.ok(audit.analyzedKm > 0);
    assert.ok(audit.issues.length >= 1);
    assert.equal(audit.issues[0].cls, "INCOMPATIBLE");
    assert.match(audit.disclaimer, /cartográfica/);
  });
});
