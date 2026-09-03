import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRouteNotesGeoJSON,
  CUE_SEVERITY_COLORS,
} from "../../lib/route-studio/route-notes-geojson.ts";
import { lngLatAtProgressM, flattenRouteLngLats } from "../../lib/route-studio/geo.ts";
import { createCue } from "../../lib/route-studio/cues.ts";

describe("route notes geojson", () => {
  const segs = [
    {
      routePoints: [
        [0, 0],
        [0, 0.01],
        [0, 0.02],
      ],
      waypoints: [
        [0, 0],
        [0, 0.02],
      ],
    },
  ];

  it("projects progress along polyline", () => {
    const line = flattenRouteLngLats(segs);
    const mid = lngLatAtProgressM(line, 500);
    assert.ok(mid);
    assert.equal(mid[0], 0);
    assert.ok(mid[1] > 0);
  });

  it("builds colored features for attention/caution/danger", () => {
    const cues = [
      createCue({ message: "A", severity: "attention", progressM: 100 }),
      createCue({ message: "B", severity: "caution", progressM: 400 }),
      createCue({ message: "C", severity: "danger", progressM: 800 }),
    ];
    const fc = buildRouteNotesGeoJSON(cues, segs);
    assert.equal(fc.features.length, 3);
    assert.equal(fc.features[0].properties.severity, "attention");
    assert.equal(fc.features[1].properties.severity, "caution");
    assert.equal(fc.features[2].properties.severity, "danger");
    assert.equal(CUE_SEVERITY_COLORS.attention, "#EAB308");
    assert.equal(CUE_SEVERITY_COLORS.caution, "#F97316");
    assert.equal(CUE_SEVERITY_COLORS.danger, "#EF4444");
  });
});
