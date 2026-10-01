"use client";

import { useEffect, type MutableRefObject } from "react";
import {
  postToNavRideApp,
  registerAppToEditorHandler,
} from "@/lib/route-studio/navride-editor-bridge";
import { parseGpxFile } from "@/lib/route-studio/navride-route/gpx-codec";
import { clearDraft } from "@/lib/route-studio/autosave";
import type {
  NavRideCue,
  NavRideRoute,
} from "@/lib/route-studio/navride-route/types";
import type { RouteCapsule } from "@/lib/route-studio/navride-route/gpx-codec";
import type { Segment } from "./editor-types";
import { buildRouteJson, exportGpx } from "./export-gpx";
import { routeSignature } from "./persistence";

function distanceKm(segments: Segment[]): number {
  const R = 6371;
  let total = 0;
  for (const segment of segments) {
    const points =
      segment.routePoints.length >= 2
        ? segment.routePoints
        : segment.waypoints;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const dLat = ((b[1] - a[1]) * Math.PI) / 180;
      const dLon = ((b[0] - a[0]) * Math.PI) / 180;
      const la1 = (a[1] * Math.PI) / 180;
      const la2 = (b[1] * Math.PI) / 180;
      const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(la1) *
          Math.cos(la2) *
          Math.sin(dLon / 2) ** 2;
      total += R * 2 * Math.asin(Math.sqrt(h));
    }
  }
  return total;
}

export function persistRouteToApp({
  alsoOpen,
  segments,
  title,
  cues,
  capsule,
  savedRouteId,
}: {
  alsoOpen: boolean;
  segments: Segment[];
  title: string;
  cues: NavRideCue[];
  capsule: RouteCapsule | null;
  savedRouteId: string | null;
}):
  | { ok: true; signature: string; message: string }
  | { ok: false; message: string } {
  const points = segments.flatMap((segment) =>
    segment.routePoints.length >= 2 && !segment.routingFailed
      ? segment.routePoints
      : [],
  );
  if (points.length < 2) {
    return {
      ok: false,
      message: "No hay geometría enrutada válida para guardar.",
    };
  }

  const gpxXml = exportGpx(segments, title, cues, capsule);
  const route = buildRouteJson(segments, title, cues, points);
  postToNavRideApp(alsoOpen ? "OPEN_IN_NAVRIDE" : "SAVE_ROUTE", {
    gpxXml,
    route: route as unknown as Record<string, unknown>,
    name: title,
    routeId: savedRouteId,
    distanceM: distanceKm(segments) * 1000,
    waypointsCount: points.length,
  });
  return {
    ok: true,
    signature: routeSignature(segments, title),
    message: alsoOpen
      ? "Enviando a NavRide…"
      : "Guardando en NavRide…",
  };
}

export interface NavRideBridgeOptions {
  enabled: boolean;
  segments: Segment[];
  routeTitle: string;
  cues: NavRideCue[];
  savedSignature: string;
  pendingLocationRequest: MutableRefObject<string | null>;
  applyImportedGeometry: (
    geometry: { lat: number; lon: number }[],
    extensions: NavRideRoute | null,
    asTrackOnly: boolean,
    capsule?: RouteCapsule | null,
  ) => void;
  applyCurrentLocation: (
    payload: Record<string, unknown> | undefined,
  ) => void;
  applyLocationError: (
    payload: Record<string, unknown> | undefined,
  ) => void;
  setRouteError: (message: string | null) => void;
  setSavedRouteId: (routeId: string | null) => void;
  setSavedSignature: (signature: string) => void;
  setUploadMsg: (
    value: { ok: boolean; text: string } | null,
  ) => void;
}

export function useNavRideAppBridge(
  options: NavRideBridgeOptions,
): void {
  const {
    enabled,
    segments,
    routeTitle,
    cues,
    savedSignature,
    pendingLocationRequest,
    applyImportedGeometry,
    applyCurrentLocation,
    applyLocationError,
    setRouteError,
    setSavedRouteId,
    setSavedSignature,
    setUploadMsg,
  } = options;

  useEffect(() => {
    if (!enabled) return;
    window.__navrideEmbedReady = true;
    postToNavRideApp("READY", {
      capabilities: {
        save: true,
        exportGpx: true,
        openInNavRide: true,
        importGpx: true,
        cloudSaveViaApp: true,
      },
    });

    const unregister = registerAppToEditorHandler((message) => {
      if (message.type === "LOAD_ROUTE") {
        const gpxXml =
          typeof message.payload?.gpxXml === "string"
            ? message.payload.gpxXml
            : "";
        if (!gpxXml) return;
        const parsed = parseGpxFile(gpxXml);
        if (!parsed.recoverable || parsed.geometry.length < 2) {
          setRouteError(parsed.issues[0] ?? "GPX no válido.");
          return;
        }
        applyImportedGeometry(
          parsed.geometry,
          parsed.extensions,
          false,
          parsed.capsule,
        );
        if (typeof message.payload?.routeId === "string") {
          setSavedRouteId(message.payload.routeId);
        }
        setUploadMsg({ ok: true, text: "Ruta cargada desde NavRide." });
      }

      if (message.type === "SAVE_RESULT") {
        const ok = message.payload?.ok === true;
        const routeId =
          typeof message.payload?.routeId === "string"
            ? message.payload.routeId
            : null;
        if (ok && routeId) setSavedRouteId(routeId);
        setUploadMsg({
          ok,
          text: ok
            ? "Guardado en NavRide."
            : String(
                message.payload?.error ?? "No se pudo guardar.",
              ),
        });
        if (ok) {
          setSavedSignature(routeSignature(segments, routeTitle));
          clearDraft();
        }
      }

      if (message.type === "CURRENT_LOCATION") {
        if (
          pendingLocationRequest.current &&
          message.requestId !== pendingLocationRequest.current
        ) {
          return;
        }
        pendingLocationRequest.current = null;
        applyCurrentLocation(message.payload);
      }

      if (message.type === "CURRENT_LOCATION_ERROR") {
        if (
          pendingLocationRequest.current &&
          message.requestId !== pendingLocationRequest.current
        ) {
          return;
        }
        pendingLocationRequest.current = null;
        applyLocationError(message.payload);
      }
    });

    return () => {
      unregister();
      window.__navrideEmbedReady = false;
    };
  }, [
    enabled,
    pendingLocationRequest,
    applyImportedGeometry,
    applyCurrentLocation,
    applyLocationError,
    routeTitle,
    segments,
    setRouteError,
    setSavedRouteId,
    setSavedSignature,
    setUploadMsg,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const dirty =
      routeSignature(segments, routeTitle) !== savedSignature;
    postToNavRideApp("DIRTY_STATE_CHANGED", { dirty });
  }, [enabled, segments, routeTitle, cues, savedSignature]);
}
