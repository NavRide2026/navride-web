import {
  NAVRIDE_GPX_NS,
  exportGpxWithExtensions,
  type TrackPointInput,
} from "../route-studio/navride-route/gpx-codec.ts";
import {
  createEmptyRoute,
  routeToJson,
  type NavRideRoute,
} from "../route-studio/navride-route/types.ts";
import type { GpxDocument, GpxPoint, GpxWaypoint } from "./types.ts";
import { allPointsIncludingHidden, lngLatsOf } from "./types.ts";

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPoint(p: GpxPoint, tag: "trkpt" | "wpt"): string {
  const lat = Number(p.lat).toFixed(7);
  const lon = Number(p.lon).toFixed(7);
  const inner: string[] = [];
  if (p.ele != null && Number.isFinite(p.ele)) inner.push(`<ele>${p.ele}</ele>`);
  if (p.time) inner.push(`<time>${escapeXml(p.time)}</time>`);
  if (p.name) inner.push(`<name>${escapeXml(p.name)}</name>`);
  if (p.cmt) inner.push(`<cmt>${escapeXml(p.cmt)}</cmt>`);
  if (p.desc) inner.push(`<desc>${escapeXml(p.desc)}</desc>`);
  if (p.extensionsXml) inner.push(`<extensions>${p.extensionsXml}</extensions>`);
  const body = inner.join("");
  if (tag === "wpt") {
    return `  <wpt lat="${lat}" lon="${lon}">${body}</wpt>`;
  }
  return `      <trkpt lat="${lat}" lon="${lon}">${body}</trkpt>`;
}

function formatWpt(w: GpxWaypoint): string {
  const p: GpxPoint = {
    lat: w.lat,
    lon: w.lon,
    ele: w.ele,
    time: w.time,
    name: w.name,
    cmt: w.cmt,
    desc: w.desc,
    extensionsXml: w.extensionsXml,
  };
  const extra: string[] = [];
  if (w.sym) extra.push(`<sym>${escapeXml(w.sym)}</sym>`);
  if (w.type) extra.push(`<type>${escapeXml(w.type)}</type>`);
  const lat = Number(w.lat).toFixed(7);
  const lon = Number(w.lon).toFixed(7);
  const inner: string[] = [];
  if (p.ele != null && Number.isFinite(p.ele)) inner.push(`<ele>${p.ele}</ele>`);
  if (p.time) inner.push(`<time>${escapeXml(p.time)}</time>`);
  if (p.name) inner.push(`<name>${escapeXml(p.name)}</name>`);
  if (p.cmt) inner.push(`<cmt>${escapeXml(p.cmt)}</cmt>`);
  if (p.desc) inner.push(`<desc>${escapeXml(p.desc)}</desc>`);
  inner.push(...extra);
  if (p.extensionsXml) inner.push(`<extensions>${p.extensionsXml}</extensions>`);
  return `  <wpt lat="${lat}" lon="${lon}">${inner.join("")}</wpt>`;
}

function flattenForCapsule(doc: GpxDocument): TrackPointInput[] {
  return allPointsIncludingHidden(doc).map((p) => ({
    lat: p.lat,
    lon: p.lon,
    ele: p.ele,
  }));
}

function routeJsonFromDoc(doc: GpxDocument): NavRideRoute {
  const pts = allPointsIncludingHidden(doc);
  const base =
    doc.navrideRoute ??
    createEmptyRoute({
      routeId: `web-${Date.now()}`,
      name: doc.name,
      geometry: {
        points: pts.map((p) => ({ lat: p.lat, lon: p.lon, ele: p.ele })),
      },
    });
  return {
    ...base,
    name: doc.name,
    geometry: {
      points: pts.map((p) => ({ lat: p.lat, lon: p.lon, ele: p.ele })),
    },
  };
}

/**
 * OPEN → SAVE without edits returns the original XML (lossless).
 * After edits, rebuilds GPX 1.1 preserving per-point ele/time/extensions,
 * waypoints, tracks/segments, Route Capsule and NavRide extensions.
 */
export function serializeGpx(doc: GpxDocument): string {
  if (!doc.dirty && doc.originalXml && doc.originalXml.includes("<gpx")) {
    return doc.originalXml;
  }

  const wpts = doc.waypoints.map(formatWpt).join("\n");
  const trks = doc.tracks
    .map((t) => {
      const segs = t.segments
        .map((s) => {
          const pts = s.points.map((p) => formatPoint(p, "trkpt")).join("\n");
          return `    <trkseg>\n${pts}\n    </trkseg>`;
        })
        .join("\n");
      const name = escapeXml(t.name || doc.name || "Track");
      const type = t.type ? `    <type>${escapeXml(t.type)}</type>\n` : "";
      return `  <trk>\n    <name>${name}</name>\n${type}${segs}\n  </trk>`;
    })
    .join("\n");

  const route = routeJsonFromDoc(doc);
  const payload = JSON.stringify(routeToJson(route));
  const capsule = doc.capsule;
  const compactCapsule = capsule
    ? JSON.stringify({
        ...capsule,
        originalTrack: {
          ...capsule.originalTrack,
          trackPoints: undefined,
          waypoints: undefined,
        },
      })
    : "";

  const extra = doc.extraExtensionsXml?.trim() ?? "";
  const extBits = [
    `<navride:route><![CDATA[${payload}]]></navride:route>`,
    compactCapsule
      ? `<navride:capsule><![CDATA[${compactCapsule}]]></navride:capsule>`
      : "",
    extra,
  ]
    .filter(Boolean)
    .join("\n    ");

  const name = escapeXml(doc.name || "Ruta");
  const desc = doc.description
    ? `<desc>${escapeXml(doc.description)}</desc>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="${escapeXml(doc.creator || "NavRide GPX Editor")}" xmlns="http://www.topografix.com/GPX/1/1" xmlns:navride="${NAVRIDE_GPX_NS}">
  <metadata><name>${name}</name>${desc}</metadata>
${wpts ? wpts + "\n" : ""}${trks}
  <extensions>
    ${extBits}
  </extensions>
</gpx>`;
}

/** Flattened export used by the App bridge (single track + capsule). */
export function serializeGpxForApp(doc: GpxDocument): string {
  const xml = serializeGpx(doc);
  if (!doc.dirty && doc.originalXml) return xml;
  const pts = flattenForCapsule(doc);
  if (pts.length < 2) return xml;
  return exportGpxWithExtensions(
    routeJsonFromDoc(doc),
    doc.name,
    pts,
    doc.capsule,
  );
}

export function geometryLngLats(doc: GpxDocument): [number, number][] {
  return lngLatsOf(doc);
}
