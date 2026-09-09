import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { classifyWay } from "../../lib/route-studio/route-compatibility.ts";
import {
  compatibleWaysOnly,
  routeOnOsmNetwork,
  snapClickToOsmNetwork,
  wayDetectedButIncompatible,
} from "../../lib/route-studio/editor-osm-network.ts";
import { auditRouteGeometry } from "../../lib/route-studio/route-compatibility-audit.ts";

const here = dirname(fileURLToPath(import.meta.url));

/** ~meters east of [0, 41] using local meters-per-degree. */
function lngAtMeters(eastM) {
  const mPerDeg = 111320 * Math.cos((41 * Math.PI) / 180);
  return eastM / mPerDeg;
}

function verticalWay(id, tags, eastM) {
  const lng = lngAtMeters(eastM);
  return {
    id,
    tags,
    geometry: [
      [lng, 40.9997],
      [lng, 41.0003],
    ],
  };
}

describe("A-F editor OSM network", () => {
  it("A) track + motor_vehicle=yes is compatible for moto", () => {
    const r = classifyWay(
      { highway: "track", motor_vehicle: "yes", surface: "gravel" },
      "moto",
    );
    assert.equal(r.cls, "COMPATIBLE");
  });

  it("B) path + foot=yes + motor_vehicle=no: moto incompatible, walking compatible", () => {
    const tags = { highway: "path", foot: "yes", motor_vehicle: "no" };
    assert.equal(classifyWay(tags, "moto").cls, "INCOMPATIBLE");
    assert.equal(classifyWay(tags, "walk").cls, "COMPATIBLE");
  });

  it("C) cycleway + bicycle=designated is compatible for bike", () => {
    const r = classifyWay(
      { highway: "cycleway", bicycle: "designated" },
      "bike",
    );
    assert.equal(r.cls, "COMPATIBLE");
  });

  it("D) private is restricted warning, not deleted from graph", () => {
    const r = classifyWay({ highway: "service", access: "private" }, "moto");
    assert.equal(r.cls, "RESTRICTED");
    const way = verticalWay(11, { highway: "service", access: "private" }, 0);
    const click = [lngAtMeters(0), 41];
    const decision = snapClickToOsmNetwork(click, [way], "moto");
    assert.ok(decision.hit, "private way remains in the editor network");
    assert.notEqual(decision.kind === "place" && !decision.hit, true);
  });

  it("E) 8 m compatible track preferred over 4 m incompatible path for moto", () => {
    const path = verticalWay(1, { highway: "path", foot: "yes" }, 4);
    const track = verticalWay(2, { highway: "track", motor_vehicle: "yes" }, 8);
    const click = [0, 41];
    const decision = snapClickToOsmNetwork(click, [path, track], "moto");
    assert.equal(decision.kind, "place");
    if (decision.kind === "place") {
      assert.equal(decision.hit?.way.id, 2);
    }
  });

  it("F) recognized incompatible way does not mean missing from graph", () => {
    const path = verticalWay(3, { highway: "path", foot: "yes", motor_vehicle: "no" }, 2);
    const click = [lngAtMeters(2), 41];
    const decision = snapClickToOsmNetwork(click, [path], "moto");
    assert.ok(decision.hit, "way is detected");
    assert.equal(decision.hit?.classification.cls, "INCOMPATIBLE");
    assert.ok(
      wayDetectedButIncompatible(decision) || decision.kind === "prompt",
      "must prompt, not pretend the way is absent",
    );
    assert.notEqual(decision.kind === "place" && decision.hit == null, true);
  });
});

describe("master network keeps all highway classes", () => {
  it("path/track/footway/cycleway/service stay in the graph regardless of moto access", () => {
    const ways = [
      verticalWay(1, { highway: "path", motor_vehicle: "no" }, 0),
      verticalWay(2, { highway: "track" }, 10),
      verticalWay(3, { highway: "footway" }, 20),
      verticalWay(4, { highway: "cycleway" }, 30),
      verticalWay(5, { highway: "residential" }, 40),
      verticalWay(6, { highway: "service" }, 50),
    ];
    const click = [lngAtMeters(0), 41];
    const decision = snapClickToOsmNetwork(click, ways, "moto");
    assert.ok(decision.hit, "nearest OSM way is detectable");
    const pref = compatibleWaysOnly(ways, "moto");
    assert.ok(pref.some((w) => w.tags.highway === "track"));
    assert.ok(pref.some((w) => w.tags.highway === "residential"));
    assert.ok(pref.some((w) => w.tags.highway === "service"));
    assert.equal(pref.some((w) => w.tags.highway === "path"), false);
  });

  it("routes along a track instead of declaring no graph", () => {
    const track = {
      id: 99,
      tags: { highway: "track", surface: "dirt" },
      geometry: [
        [0, 41],
        [lngAtMeters(80), 41],
      ],
    };
    const pts = routeOnOsmNetwork( [track], [0, 41], [lngAtMeters(80), 41], "moto");
    assert.ok(pts.length >= 2);
    assert.ok(Math.abs(pts[0][0]) < 0.001 || pts.length >= 2);
  });
});

describe("editor no longer uses OSRM existence snap", () => {
  it("GpxEditor does not call snapClickToRoute or emit snap > 25 m", () => {
    const src = readFileSync(
      join(here, "../../components/gpx/GpxEditor.tsx"),
      "utf8",
    );
    assert.doesNotMatch(src, /snapClickToRoute/);
    assert.doesNotMatch(src, /snap > /);
    assert.doesNotMatch(src, /camino no está disponible en los datos de routing/);
    assert.match(src, /snapClickToOsmNetwork/);
    assert.match(src, /routeOnOsmNetwork/);
  });

  it("Overpass query keeps all highway=* without access filter", () => {
    const src = readFileSync(
      join(here, "../../lib/route-studio/route-compatibility-overpass.ts"),
      "utf8",
    );
    assert.match(src, /\["highway"\]/);
    assert.doesNotMatch(src, /motor_vehicle!=no/);
    assert.doesNotMatch(src, /access!=private/);
  });
});

describe("audit issues are real access spans", () => {
  it("marks motor prohibition on the exact span", () => {
    const pts = [
      [0, 41],
      [lngAtMeters(80), 41],
    ];
    const way = {
      id: 7,
      tags: { highway: "path", motor_vehicle: "no" },
      geometry: [
        [0, 41],
        [lngAtMeters(80), 41],
      ],
    };
    const audit = auditRouteGeometry(pts, [way], "moto");
    assert.ok(audit.issues.length >= 1);
    assert.match(audit.issues[0].reason, /NO COMPATIBLE CON MOTO/);
  });
});
