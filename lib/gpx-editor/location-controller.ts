import type { MutableRefObject } from "react";
import {
  newBridgeRequestId,
  postToNavRideApp,
} from "@/lib/route-studio/navride-editor-bridge";
import type { LngLat, Segment } from "./editor-types";
import type { GpxMapAdapter } from "./map-adapter";

export interface LocationControllerDeps {
  embedNavRideApp: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: () => any;
  adapter: () => GpxMapAdapter | null;
  pendingRequest: MutableRefObject<string | null>;
  setLocating: (value: boolean) => void;
  setError: (message: string | null) => void;
  setLocation: (point: LngLat) => void;
  syncUserMarker: (point: LngLat | null) => void;
}

function flyTo(
  deps: LocationControllerDeps,
  point: LngLat,
  duration: number,
): void {
  const map = deps.map();
  if (!map) return;
  const currentZoom = map.getZoom?.() ?? 15;
  map.flyTo({
    center: point,
    zoom: Math.max(currentZoom, 14),
    duration,
  });
}

export function requestCurrentLocation(
  deps: LocationControllerDeps,
): void {
  if (!deps.map()) return;

  if (deps.embedNavRideApp) {
    deps.setLocating(true);
    deps.setError(null);
    const requestId = newBridgeRequestId();
    deps.pendingRequest.current = requestId;
    postToNavRideApp("REQUEST_CURRENT_LOCATION", {}, requestId);
    window.setTimeout(() => {
      if (deps.pendingRequest.current !== requestId) return;
      deps.pendingRequest.current = null;
      deps.setLocating(false);
      deps.setError("No se ha podido obtener tu ubicación.");
    }, 8000);
    return;
  }

  if (!navigator.geolocation) {
    deps.setError("Geolocalización no disponible en este navegador.");
    return;
  }

  deps.setLocating(true);
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const point: LngLat = [coords.longitude, coords.latitude];
      deps.setLocation(point);
      deps.syncUserMarker(point);
      deps.map()?.flyTo({
        center: point,
        zoom: 15,
        duration: 1200,
      });
      deps.setLocating(false);
      deps.setError(
        coords.accuracy > 80
          ? "Precisión GPS aún baja — espera unos segundos."
          : null,
      );
    },
    (error) => {
      deps.setLocating(false);
      if (error.code === error.PERMISSION_DENIED) {
        deps.setError(
          "Ubicación denegada. Activa el permiso de geolocalización en el navegador.",
        );
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        deps.setError("Ubicación no disponible en este momento.");
      } else {
        deps.setError(
          "No se pudo obtener tu ubicación. Revisa permisos del navegador.",
        );
      }
    },
    { enableHighAccuracy: true, timeout: 12000 },
  );
}

export function applyAppCurrentLocation(
  payload: Record<string, unknown> | undefined,
  deps: LocationControllerDeps,
): void {
  const lat = Number(payload?.latitude);
  const lon = Number(payload?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    deps.setLocating(false);
    deps.setError("No se ha podido obtener tu ubicación.");
    return;
  }
  const point: LngLat = [lon, lat];
  deps.setLocation(point);
  deps.syncUserMarker(point);
  flyTo(deps, point, 1000);
  deps.setLocating(false);
  deps.setError(null);
}

export function applyAppLocationError(
  payload: Record<string, unknown> | undefined,
  deps: LocationControllerDeps,
): void {
  deps.setLocating(false);
  const reason = String(payload?.reason ?? "LOCATION_UNAVAILABLE");
  deps.setError(
    reason === "PERMISSION_DENIED"
      ? "NavRide necesita permiso de ubicación."
      : "No se ha podido obtener tu ubicación.",
  );
}

export function fitRouteViewport(
  adapter: GpxMapAdapter | null,
  segments: Segment[],
): void {
  if (!adapter) return;
  const points = segments.flatMap((segment) =>
    segment.routePoints.length >= 2 && !segment.routingFailed
      ? segment.routePoints
      : segment.waypoints,
  );
  if (points.length < 2) return;
  adapter.fit(points);
}
