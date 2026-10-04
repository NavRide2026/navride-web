"use client";

import { useEffect, useRef, useState } from "react";
import { buildSatelliteStyleSync } from "@/lib/route-studio/satellite-style";
import {
  SATELLITE_DEFAULT_PITCH,
  SATELLITE_DEM_SOURCE_ID,
  SATELLITE_MAX_PITCH,
  TERRAIN_QA_SAMPLES,
} from "@/lib/route-studio/satellite-terrain";
import { enableSatelliteTerrain } from "@/lib/gpx-editor/satellite-terrain-runtime";

type SampleRow = { name: string; elev: number | null };

export default function TerrainQaPage() {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [rows, setRows] = useState<SampleRow[]>([]);
  const [terrain, setTerrain] = useState<string>("pending");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    let map: import("maplibre-gl").Map | null = null;

    void (async () => {
      const maplibre = await import("maplibre-gl");
      if (cancelled || !elRef.current) return;
      try {
        maplibre.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
      } catch {
        // Fall through to the bundled worker if the helper is missing.
      }
      map = new maplibre.Map({
        container: elRef.current,
        style: buildSatelliteStyleSync() as never,
        center: [0.657, 42.632],
        zoom: 12.4,
        pitch: SATELLITE_DEFAULT_PITCH,
        bearing: 42,
        maxPitch: SATELLITE_MAX_PITCH,
        attributionControl: { compact: true },
      });

      map.on("error", (event) => {
        const msg = String(event.error?.message ?? event.error ?? "map error");
        setErrors((prev) => [...prev.slice(-8), msg]);
      });

      const probe = () => {
        if (!map) return;
        enableSatelliteTerrain(map as never);
        const t = map.getTerrain();
        const source = map.getSource(SATELLITE_DEM_SOURCE_ID);
        setTerrain(
          JSON.stringify({
            terrain: t,
            hasSource: Boolean(source),
          }),
        );
        const next = TERRAIN_QA_SAMPLES.map((sample) => {
          let elev: number | null = null;
          try {
            const value = map!.queryTerrainElevation(
              new maplibre.LngLat(sample.lng, sample.lat),
            );
            elev = typeof value === "number" && Number.isFinite(value) ? value : null;
          } catch {
            elev = null;
          }
          return { name: sample.name, elev };
        });
        setRows(next);
      };

      let idleCount = 0;
      map.on("load", probe);
      map.on("style.load", probe);
      map.on("idle", () => {
        idleCount += 1;
        if (idleCount <= 8) probe();
      });
      (window as unknown as { __navrideTerrainMap?: typeof map }).__navrideTerrainMap = map;
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div style={{ height: "100dvh", display: "grid", gridTemplateRows: "auto 1fr" }}>
      <aside
        style={{
          padding: 12,
          background: "#111",
          color: "#eee",
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
        }}
      >
        <strong>QA terreno 3D — Aneto</strong>
        <div>terrain: {terrain}</div>
        {rows.map((row) => (
          <div key={row.name}>
            {row.name}: {row.elev == null ? "null" : `${row.elev.toFixed(1)} m`}
          </div>
        ))}
        {errors.map((err) => (
          <div key={err} style={{ color: "#f87171" }}>
            {err}
          </div>
        ))}
      </aside>
      <div ref={elRef} style={{ minHeight: 0 }} />
    </div>
  );
}
