import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRouteNotesGeoJSON,
  reprojectCuesOnTrack,
} from "../../lib/route-studio/route-notes-geojson.ts";
import {
  progressMNearestOnPolyline,
  NOTE_OFF_TRACK_METERS,
  EDITOR_MAX_SNAP_METERS,
} from "../../lib/route-studio/geo.ts";
import { createCue } from "../../lib/route-studio/cues.ts";

describe("cue projection — distinct offsets", () => {
  // ~111m per 0.001 deg latitude
  const segs = [
    {
      routePoints: [
        [2.0, 41.0],
        [2.0, 41.001], // ~111 m
        [2.0, 41.005], // ~555 m more → ~666 m total
        [2.0, 41.01], // ~555 m more → ~1221 m total
      ],
      waypoints: [
        [2.0, 41.0],
        [2.0, 41.01],
      ],
    },
  ];

  it("NOTE_1/2/3 at distinct progressM from distinct lat/lon", () => {
    const n1 = progressMNearestOnPolyline(segs[0].routePoints, [2.0, 41.0009]);
    const n2 = progressMNearestOnPolyline(segs[0].routePoints, [2.0, 41.0045]);
    const n3 = progressMNearestOnPolyline(segs[0].routePoints, [2.0, 41.0095]);
    assert.ok(n1 && n2 && n3);
    assert.ok(n1.progressM > 50 && n1.progressM < 150, `n1=${n1.progressM}`);
    assert.ok(n2.progressM > 400 && n2.progressM < 700, `n2=${n2.progressM}`);
    assert.ok(n3.progressM > 1000 && n3.progressM < 1300, `n3=${n3.progressM}`);
    assert.notEqual(Math.round(n1.progressM), Math.round(n2.progressM));
    assert.notEqual(Math.round(n2.progressM), Math.round(n3.progressM));

    const cues = [
      createCue({
        message: "N1",
        severity: "attention",
        lat: 41.0009,
        lon: 2.0,
        progressM: n1.progressM,
      }),
      createCue({
        message: "N2",
        severity: "caution",
        lat: 41.0045,
        lon: 2.0,
        progressM: n2.progressM,
      }),
      createCue({
        message: "N3",
        severity: "danger",
        lat: 41.0095,
        lon: 2.0,
        progressM: n3.progressM,
      }),
    ];
    const fc = buildRouteNotesGeoJSON(cues, segs);
    assert.equal(fc.features.length, 3);
    // Markers stay at user lat/lon, not mid-route clone
    assert.equal(fc.features[0].geometry.coordinates[1], 41.0009);
    assert.equal(fc.features[1].geometry.coordinates[1], 41.0045);
    assert.equal(fc.features[2].geometry.coordinates[1], 41.0095);
    assert.notEqual(
      fc.features[0].properties.progressM,
      fc.features[1].properties.progressM,
    );
  });

  it("off-track note keeps lat/lon and null progress", () => {
    const far = [2.05, 41.0]; // far east
    const hit = progressMNearestOnPolyline(segs[0].routePoints, far);
    assert.ok(hit);
    assert.ok(hit.distanceToTrackM > NOTE_OFF_TRACK_METERS);
    const cue = createCue({
      message: "FAR",
      lat: far[1],
      lon: far[0],
      progressM: null,
      noteStatus: "off_track",
    });
    const fc = buildRouteNotesGeoJSON([cue], segs);
    assert.equal(fc.features[0].geometry.coordinates[0], 2.05);
    assert.equal(fc.features[0].properties.progressM, null);
  });

  it("reproject after route change preserves lat/lon", () => {
    const cues = [
      createCue({
        message: "A",
        lat: 41.001,
        lon: 2.0,
        progressM: 100,
      }),
    ];
    const longer = [
      {
        routePoints: [
          [2.0, 41.0],
          [2.0, 41.02],
        ],
        waypoints: [
          [2.0, 41.0],
          [2.0, 41.02],
        ],
      },
    ];
    const out = reprojectCuesOnTrack(cues, longer);
    assert.equal(out[0].lat, 41.001);
    assert.equal(out[0].lon, 2.0);
    assert.ok(out[0].progressM != null);
    assert.ok(out[0].progressM > 0);
  });

  it("editor max snap is documented and small", () => {
    assert.ok(EDITOR_MAX_SNAP_METERS <= 40);
    assert.ok(EDITOR_MAX_SNAP_METERS >= 10);
  });
});
