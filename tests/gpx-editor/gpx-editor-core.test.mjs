import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { GpxEditorEngine } from "../../lib/gpx-editor/engine.ts";
import { parseGpxDocument } from "../../lib/gpx-editor/parse.ts";
import { serializeGpx } from "../../lib/gpx-editor/serialize.ts";
import { visibleAnchors, markDocumentAnchors } from "../../lib/gpx-editor/anchors.ts";
import { computeStats, elevationProfile } from "../../lib/gpx-editor/stats.ts";
import { cropDocument, splitDocument, mergeTracks, simplifyDocument, estimateSimplify } from "../../lib/gpx-editor/ops.ts";
import { isStaleGeneration } from "../../lib/gpx-editor/engine.ts";
import { classifyWay } from "../../lib/route-studio/route-compatibility.ts";
import { decideEditorSnap, rankWaysNearClick } from "../../lib/route-studio/route-compatibility-snap.ts";
import { routeOnOsmNetwork } from "../../lib/route-studio/editor-osm-network.ts";
import { auditRouteGeometry } from "../../lib/route-studio/route-compatibility-audit.ts";
import { classifyPoiTags, dedupPois, PoiTileStore, poiTileKey } from "../../lib/route-studio/navride-poi.ts";

const here = dirname(fileURLToPath(import.meta.url));

function ll(lon, lat) {
  return { lat, lon };
}

describe("01-05 anchors", () => {
  it("01 crear ruta con 2 anchors", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69, [[-3.70, 40.42], [-3.69, 40.43]]);
    const pts = e.doc.tracks[0].segments[0].points;
    assert.equal(pts.length >= 2, true);
    assert.equal(pts[0].anchor, true);
    assert.equal(pts[pts.length - 1].anchor, true);
  });

  it("02 añadir tercer anchor", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    e.addClick(40.44, -3.68);
    assert.ok(e.doc.tracks[0].segments[0].points.length >= 3);
  });

  it("03 mover anchor sólo cambia el tramo", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69, [[-3.70, 40.42], [-3.695, 40.425], [-3.69, 40.43]]);
    e.addClick(40.44, -3.68, [[-3.69, 40.43], [-3.685, 40.435], [-3.68, 40.44]]);
    const before = e.doc.tracks[0].segments[0].points.map((p) => `${p.lat},${p.lon}`);
    e.move(0, 0, 0, [-3.701, 40.421], [[-3.701, 40.421], [-3.69, 40.43]]);
    const after = e.doc.tracks[0].segments[0].points;
    assert.ok(after[after.length - 1].lat === 40.44);
    assert.ok(before.length >= 2);
  });

  it("04 insertar anchor", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    e.insert(0, 0, 1, [-3.695, 40.425]);
    assert.ok(e.doc.tracks[0].segments[0].points.length >= 3);
  });

  it("05 borrar anchor", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    e.addClick(40.44, -3.68);
    const n = e.doc.tracks[0].segments[0].points.length;
    e.removeAnchor(0, 0, 1);
    assert.ok(e.doc.tracks[0].segments[0].points.length < n);
  });
});

describe("06-08 latest-wins undo redo", () => {
  it("06 latest-wins", () => {
    const e = new GpxEditorEngine();
    const g1 = e.bump();
    e.bump();
    assert.equal(e.isStale(g1), true);
    assert.equal(isStaleGeneration(4, 4), false);
  });

  it("07 undo", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    const n = e.doc.tracks[0].segments[0].points.length;
    e.undo();
    assert.ok(e.doc.tracks[0].segments[0].points.length < n);
  });

  it("08 redo", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    const n = e.doc.tracks[0].segments[0].points.length;
    e.undo();
    e.redo();
    assert.equal(e.doc.tracks[0].segments[0].points.length, n);
  });
});

describe("09-26 snap y perfiles", () => {
  const way = (tags, geom) => ({ id: 1, tags, geometry: geom });
  const line = [
    [-3.70, 40.42],
    [-3.69, 40.42],
  ];

  it("09 CAR snap residential", () => {
    const hits = rankWaysNearClick([-3.695, 40.42], [way({ highway: "residential" }, line)], "car");
    const d = decideEditorSnap([-3.695, 40.42], hits);
    assert.equal(d.kind, "place");
  });

  it("10 MOTORCYCLE snap track gravel", () => {
    assert.equal(classifyWay({ highway: "track", surface: "gravel" }, "moto").cls, "COMPATIBLE");
  });

  it("11 BICYCLE snap cycleway", () => {
    assert.equal(classifyWay({ highway: "cycleway" }, "bike").cls, "COMPATIBLE");
  });

  it("12 WALKING snap footway", () => {
    assert.equal(classifyWay({ highway: "footway", foot: "yes" }, "walk").cls, "COMPATIBLE");
  });

  it("13 motorway car ok", () => {
    assert.equal(classifyWay({ highway: "motorway" }, "car").cls, "COMPATIBLE");
  });

  it("14 residential", () => {
    assert.equal(classifyWay({ highway: "residential" }, "car").cls, "COMPATIBLE");
  });

  it("15 service", () => {
    assert.ok(["COMPATIBLE", "WARNING", "UNKNOWN"].includes(classifyWay({ highway: "service" }, "car").cls));
  });

  it("16 track existe en red moto", () => {
    const r = classifyWay({ highway: "track", surface: "dirt" }, "moto");
    assert.equal(r.cls, "COMPATIBLE");
    assert.match(r.wayTypeLabel.toLowerCase(), /pista|track|tierra|camino/i);
  });

  it("17 path known for moto", () => {
    const r = classifyWay({ highway: "path" }, "moto");
    assert.equal(r.cls, "INCOMPATIBLE");
    assert.ok(r.wayTypeLabel.length > 0);
  });

  it("18 footway known", () => {
    assert.equal(classifyWay({ highway: "footway" }, "moto").cls, "INCOMPATIBLE");
  });

  it("19 cycleway", () => {
    assert.equal(classifyWay({ highway: "cycleway" }, "bike").cls, "COMPATIBLE");
  });

  it("20 motor_vehicle=no", () => {
    assert.equal(classifyWay({ highway: "residential", motor_vehicle: "no" }, "car").cls, "INCOMPATIBLE");
  });

  it("21 motorcycle=no", () => {
    assert.equal(classifyWay({ highway: "residential", motorcycle: "no" }, "moto").cls, "INCOMPATIBLE");
  });

  it("22 bicycle=no", () => {
    assert.equal(classifyWay({ highway: "residential", bicycle: "no" }, "bike").cls, "INCOMPATIBLE");
  });

  it("23 foot=no", () => {
    assert.equal(classifyWay({ highway: "path", foot: "no" }, "walk").cls, "INCOMPATIBLE");
  });

  it("24 private", () => {
    const r = classifyWay({ highway: "service", access: "private" }, "car");
    assert.ok(r.cls === "RESTRICTED" || r.cls === "INCOMPATIBLE");
  });

  it("25 gravel permitido moto", () => {
    assert.equal(classifyWay({ highway: "track", surface: "gravel" }, "moto").cls, "COMPATIBLE");
  });

  it("26 dirt permitido moto", () => {
    assert.equal(classifyWay({ highway: "track", surface: "dirt" }, "moto").cls, "COMPATIBLE");
  });
});

const CAPSULE = `<?xml version="1.0"?>
<gpx version="1.1" creator="NavRide" xmlns="http://www.topografix.com/GPX/1/1" xmlns:navride="https://navride.app/ns/gpx/v1">
  <wpt lat="40.42" lon="-3.70"><name>A</name><desc>x</desc><sym>Flag</sym></wpt>
  <trk><name>T1</name><trkseg>
    <trkpt lat="40.4200" lon="-3.7000"><ele>650</ele><time>2024-01-01T10:00:00Z</time><extensions><foo>1</foo></extensions></trkpt>
    <trkpt lat="40.4210" lon="-3.6990"><ele>652</ele></trkpt>
    <trkpt lat="40.4220" lon="-3.6980"><ele>655</ele></trkpt>
  </trkseg><trkseg>
    <trkpt lat="40.4230" lon="-3.6970"></trkpt>
    <trkpt lat="40.4240" lon="-3.6960"></trkpt>
  </trkseg></trk>
  <trk><name>T2</name><trkseg>
    <trkpt lat="40.4300" lon="-3.6900"></trkpt>
    <trkpt lat="40.4310" lon="-3.6890"></trkpt>
  </trkseg></trk>
  <extensions>
    <navride:route><![CDATA[{"schemaVersion":1,"routeId":"r1","name":"T1","geometry":{"points":[]},"segments":[]}]]></navride:route>
    <navride:capsule><![CDATA[{"routeSchemaVersion":2,"capsuleId":"c1","originalTrack":{"trackId":"t","source":"web","originalFormat":"gpx","importedAt":"2024-01-01","contentHash":"h","originalMetadata":{}},"derivedRoute":{"derivedRouteId":"d","sourceTrackId":"t","derivationMethod":"passthrough_original_track","createdAt":"2024-01-01"},"canonicalRoute":{"canonicalRouteId":"r1","name":"T1","provenance":{"sourceType":"WEB_EDITOR","sourceId":"r1","sourceHash":"h","generatedAt":"2024-01-01","schemaVersion":2},"sourceTrackId":"t","metadata":{}},"provenance":{"sourceType":"WEB_EDITOR","sourceId":"r1","sourceHash":"h","generatedAt":"2024-01-01","schemaVersion":2}}]]></navride:capsule>
  </extensions>
</gpx>`;

describe("27-45 GPX structural", () => {
  it("27 importar GPX", () => {
    const p = parseGpxDocument(CAPSULE);
    assert.equal(p.recoverable, true);
    assert.ok(p.doc.tracks.length >= 2);
    assert.equal(p.doc.waypoints.length, 1);
  });

  it("28 save sin cambios lossless", () => {
    const p = parseGpxDocument(CAPSULE);
    const out = serializeGpx(p.doc);
    assert.equal(out, CAPSULE);
  });

  it("29 preservar Route Capsule", () => {
    const p = parseGpxDocument(CAPSULE);
    assert.ok(p.doc.capsule);
    const e = new GpxEditorEngine();
    e.loadXml(CAPSULE);
    e.addClick(40.5, -3.6);
    const xml = e.saveXml();
    assert.match(xml, /navride:capsule/);
  });

  it("30 preservar extensiones", () => {
    const p = parseGpxDocument(CAPSULE);
    assert.match(p.doc.tracks[0].segments[0].points[0].extensionsXml ?? "", /foo/);
  });

  it("31 editar segmento importado resto intacto", () => {
    const p = parseGpxDocument(CAPSULE);
    const t2 = p.doc.tracks[1].segments[0].points.map((x) => `${x.lat},${x.lon}`).join("|");
    const e = new GpxEditorEngine();
    e.loadXml(CAPSULE);
    e.move(0, 0, 1, [-3.6985, 40.4212]);
    const t2b = e.doc.tracks[1].segments[0].points.map((x) => `${x.lat},${x.lon}`).join("|");
    assert.equal(t2, t2b);
  });

  it("32 reverse", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    const last = e.doc.tracks[0].segments[0].points[0].lat;
    e.reverse();
    assert.equal(e.doc.tracks[0].segments[0].points.at(-1).lat, last);
  });

  it("33 crop", () => {
    const e = new GpxEditorEngine();
    e.addClick(1, 1);
    e.addClick(2, 2);
    e.addClick(3, 3);
    e.addClick(4, 4);
    e.crop(1, 2);
    assert.ok(e.doc.tracks[0].segments[0].points.length <= 3);
  });

  it("34 split", () => {
    const e = new GpxEditorEngine();
    e.addClick(1, 1);
    e.addClick(2, 2);
    e.addClick(3, 3);
    e.addClick(4, 4);
    e.split(1, "tracks");
    assert.equal(e.doc.tracks.length, 2);
  });

  it("35 merge", () => {
    const e = new GpxEditorEngine();
    e.addClick(1, 1);
    e.addClick(2, 2);
    e.addClick(3, 3);
    e.split(1, "tracks");
    e.merge("connect");
    assert.equal(e.doc.tracks.length, 1);
  });

  it("36 close loop", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    e.closeLoop([[-3.69, 40.43], [-3.70, 40.42]]);
    const pts = e.doc.tracks[0].segments[0].points;
    assert.ok(Math.abs(pts[0].lat - pts[pts.length - 1].lat) < 0.001);
  });

  it("37 back to start", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    e.backToStart([[-3.69, 40.43], [-3.70, 40.42]]);
    assert.ok(e.doc.tracks[0].segments[0].points.length >= 3);
  });

  it("38 round trip", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    const n = e.doc.tracks[0].segments[0].points.length;
    e.roundTrip();
    assert.ok(e.doc.tracks[0].segments[0].points.length > n);
  });

  it("39 start loop here", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    e.addClick(40.44, -3.68);
    e.closeLoop([[-3.68, 40.44], [-3.70, 40.42]]);
    e.startLoopHere(1);
    assert.ok(e.doc.tracks[0].segments[0].points.length >= 3);
  });

  it("40 simplify", () => {
    const e = new GpxEditorEngine();
    for (let i = 0; i < 40; i++) e.addClick(40.42 + i * 0.0001, -3.70);
    const { before, after } = e.simplify(50);
    assert.ok(after <= before);
    const est = estimateSimplify(e.doc, 20);
    assert.ok(est.before >= est.after);
  });

  it("41-43 waypoints", () => {
    const e = new GpxEditorEngine();
    e.addWpt(40.42, -3.70, "A");
    assert.equal(e.doc.waypoints.length, 1);
    const id = e.doc.waypoints[0].id;
    e.moveWpt(id, 40.43, -3.71);
    assert.equal(e.doc.waypoints[0].lat, 40.43);
    e.deleteWpt(id);
    assert.equal(e.doc.waypoints.length, 0);
  });

  it("44-45 multiple tracks/segments", () => {
    const p = parseGpxDocument(CAPSULE);
    assert.ok(p.doc.tracks.length >= 2);
    assert.ok(p.doc.tracks[0].segments.length >= 2);
  });
});

describe("46-50 elevation layers", () => {
  it("46-47 elevation + perfil", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.doc.tracks[0].segments[0].points[0].ele = 100;
    e.addClick(40.43, -3.69);
    e.doc.tracks[0].segments[0].points.at(-1).ele = 140;
    const s = computeStats(e.doc);
    assert.ok(s.distanceM > 0);
    assert.ok(s.ascentM >= 0);
    const prof = elevationProfile(e.doc);
    assert.ok(prof.length >= 1);
  });

  it("48 surface data in classify", () => {
    const r = classifyWay({ highway: "track", surface: "gravel" }, "moto");
    assert.match(r.surfaceLabel.toLowerCase(), /grava|gravel|pista|tierra|compact/i);
  });

  it("49-50 arrows/marks are UI flags (core keeps geometry)", () => {
    const src = readFileSync(join(here, "../../components/gpx/GpxEditor.tsx"), "utf8");
    assert.match(src, /Flechas de dirección/);
    assert.match(src, /Marcadores de distancia/);
  });
});

describe("51-57 POI", () => {
  it("51-54 classify parking fuel restaurant cafe", () => {
    assert.equal(classifyPoiTags({ amenity: "parking" }), "parking");
    assert.equal(classifyPoiTags({ amenity: "fuel" }), "fuel");
    assert.equal(classifyPoiTags({ amenity: "restaurant" }), "restaurant");
    assert.equal(classifyPoiTags({ amenity: "cafe" }), "cafe");
    assert.equal(classifyPoiTags({ tourism: "museum" }), null);
  });

  it("55-57 cache dedup stale", () => {
    const store = new PoiTileStore();
    const g1 = store.bump();
    store.put(poiTileKey(40.42, -3.70), [{ id: "n", lat: 40.42, lon: -3.7, category: "fuel" }], g1);
    store.bump();
    assert.equal(store.isStale(g1), true);
    const a = { id: "a", lat: 40.42, lon: -3.7, category: "fuel", osmId: 1 };
    assert.equal(dedupPois([a, { ...a, id: "b" }]).length, 1);
  });
});

describe("58-66 doctor timeouts", () => {
  it("58-60 Route Doctor issue fly geometry", () => {
    const pts = [[-3.70, 40.42], [-3.69, 40.42]];
    const way = { id: 9, tags: { highway: "path", motor_vehicle: "no" }, geometry: pts };
    const audit = auditRouteGeometry(pts, [way], "moto");
    assert.ok(audit.issues.length >= 1);
    assert.ok(audit.issues[0].midpoint);
  });

  it("61-62 save xml usable app/web", () => {
    const e = new GpxEditorEngine();
    e.loadXml(CAPSULE);
    const xml = e.saveXml();
    assert.match(xml, /<gpx/);
    assert.match(xml, /trkpt/);
  });

  it("63-66 stale/timeout flags", () => {
    assert.equal(isStaleGeneration(1, 2), true);
    const src = readFileSync(join(here, "../../lib/gpx-editor/elevation.ts"), "utf8");
    assert.match(src, /timeout/);
    const over = readFileSync(join(here, "../../lib/route-studio/route-compatibility-overpass.ts"), "utf8");
    assert.match(over, /timeout/);
  });
});

describe("67 editor identity", () => {
  it("single editor, no gpx.studio clone, OSM snap", () => {
    const src = readFileSync(join(here, "../../components/gpx/GpxEditor.tsx"), "utf8");
    assert.match(src, /snapClickToOsmNetwork/);
    assert.match(src, /routeOnOsmNetwork/);
    assert.doesNotMatch(src, /snapClickToRoute/);
    assert.doesNotMatch(src, /gpx\.studio/);
    assert.doesNotMatch(src, /graphhopper\.gpx\.studio/i);
    assert.match(src, /Invertir/);
    assert.match(src, /Ida y vuelta/);
    assert.match(src, /Volver al inicio/);
    assert.match(src, /Cerrar circuito/);
    assert.match(src, /Puntos de interés/);
    assert.match(src, /capsuleRef/);
    assert.match(src, /exportGpx\([^)]*capsuleRef\.current/);
    assert.match(src, /parsed\.capsule/);
  });
});

describe("casos A-G", () => {
  it("A moto dos clics", () => {
    const e = new GpxEditorEngine();
    e.mode = "moto";
    e.addClick(40.42, -3.70);
    e.addClick(40.50, -3.60, [[-3.70, 40.42], [-3.60, 40.50]]);
    assert.ok(e.doc.tracks[0].segments[0].points.length >= 2);
  });

  it("B move partial", () => {
    const e = new GpxEditorEngine();
    e.addClick(40.42, -3.70);
    e.addClick(40.43, -3.69);
    e.addClick(40.44, -3.68);
    const last = e.doc.tracks[0].segments[0].points.at(-1).lat;
    e.move(0, 0, 0, [-3.701, 40.421]);
    assert.equal(e.doc.tracks[0].segments[0].points.at(-1).lat, last);
  });

  it("C gravel moto", () => {
    assert.equal(classifyWay({ highway: "track", surface: "gravel" }, "moto").cls, "COMPATIBLE");
  });

  it("D path detected incompatible", () => {
    const r = classifyWay({ highway: "path", foot: "yes" }, "moto");
    assert.equal(r.cls, "INCOMPATIBLE");
    assert.ok(r.reason.length > 0);
  });

  it("E import edit 500m rest intact", () => {
    const e = new GpxEditorEngine();
    e.loadXml(CAPSULE);
    const t2 = JSON.stringify(e.doc.tracks[1]);
    e.move(0, 0, 1, [-3.6988, 40.4211]);
    assert.equal(JSON.stringify(e.doc.tracks[1]), t2);
  });

  it("F undo chain", () => {
    const e = new GpxEditorEngine();
    e.addClick(1, 1);
    e.addClick(2, 2);
    e.addClick(3, 3);
    const snap = e.doc.tracks[0].segments[0].points.length;
    e.undo();
    e.undo();
    e.redo();
    e.redo();
    assert.equal(e.doc.tracks[0].segments[0].points.length, snap);
  });

  it("G web engine xml = app-compatible gpx", () => {
    const e = new GpxEditorEngine();
    e.addClick(41.4, 2.17);
    e.addClick(41.41, 2.18);
    const xml = e.saveXml();
    assert.match(xml, /<trkpt/);
    assert.match(xml, /xmlns:navride/);
  });
});

void cropDocument;
void splitDocument;
void mergeTracks;
void simplifyDocument;
void markDocumentAnchors;
void visibleAnchors;
void routeOnOsmNetwork;
void ll;
