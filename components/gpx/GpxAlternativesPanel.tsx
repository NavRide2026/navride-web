"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import type { LngLat } from "@/lib/gpx-editor/editor-types";
import type { TransportMode } from "@/lib/route-studio/routing";
import type { RouteSegmentMode } from "@/lib/route-studio/segment-routing-mode";

export type AlternativeProfile = {
  id: "short" | "fast" | "balanced" | "adventure";
  label: string;
  segmentMode: RouteSegmentMode;
  distanceKm: number | null;
  etaMinutes: number | null;
  elevHint: string;
  surfaceHint: string;
  ok: boolean;
  message?: string;
};

export function GpxAlternativesPanel({
  waypoints,
  transportMode,
  onApply,
  onClose,
}: {
  waypoints: LngLat[];
  transportMode: TransportMode;
  onApply: (mode: RouteSegmentMode, points: LngLat[]) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<AlternativeProfile[] | null>(null);

  const runCompare = async () => {
    if (waypoints.length < 2) return;
    setLoading(true);
    const profiles: {
      id: AlternativeProfile["id"];
      label: string;
      segmentMode: RouteSegmentMode;
      elevHint: string;
      surfaceHint: string;
    }[] = [
      {
        id: "short",
        label: "Corta",
        segmentMode: "FOLLOW_ROAD",
        elevHint: "Prioriza distancia",
        surfaceHint: "Carretera",
      },
      {
        id: "fast",
        label: "Rápida",
        segmentMode: "FOLLOW_ROAD",
        elevHint: "Prioriza tiempo",
        surfaceHint: "Carretera",
      },
      {
        id: "balanced",
        label: "Equilibrada",
        segmentMode: "FOLLOW_ROAD",
        elevHint: "Mixto",
        surfaceHint: "Carretera / pista",
      },
      {
        id: "adventure",
        label: "Adventure",
        segmentMode: "FOLLOW_TRAIL",
        elevHint: "Más desnivel posible",
        surfaceHint: "Pistas / senderos",
      },
    ];

    const results: AlternativeProfile[] = [];
    for (const profile of profiles) {
      try {
        const res = await fetch("/api/gpx-routing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            waypoints,
            mode: transportMode,
            segmentMode: profile.segmentMode,
            preference: profile.id,
          }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          points?: LngLat[];
          distanceKm?: number;
          durationSec?: number;
          message?: string;
        };
        if (!res.ok || !data.ok || !data.points) {
          results.push({
            ...profile,
            distanceKm: null,
            etaMinutes: null,
            ok: false,
            message: data.message ?? "Sin ruta",
          });
          continue;
        }
        const km =
          data.distanceKm ??
          estimateKm(data.points);
        const eta =
          data.durationSec != null
            ? Math.round(data.durationSec / 60)
            : Math.round((km / 40) * 60);
        results.push({
          ...profile,
          distanceKm: Math.round(km * 100) / 100,
          etaMinutes: eta,
          ok: true,
        });
        (results[results.length - 1] as AlternativeProfile & { _points?: LngLat[] })._points =
          data.points;
      } catch {
        results.push({
          ...profile,
          distanceKm: null,
          etaMinutes: null,
          ok: false,
          message: "Error de red",
        });
      }
    }
    setRows(results);
    setLoading(false);
  };

  return (
    <div className="absolute left-1/2 top-14 z-20 w-[min(340px,calc(100vw-24px))] -translate-x-1/2 rounded-2xl border border-white/15 bg-[#0a0a0a]/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-white">Alternativas de ruta</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar alternativas"
        >
          <X size={14} />
        </button>
      </div>
      <p className="mb-2 text-[11px] text-white/45">
        Compara corta, rápida, equilibrada y Adventure sobre los waypoints actuales.
      </p>
      {!rows && (
        <button
          type="button"
          disabled={loading || waypoints.length < 2}
          onClick={() => void runCompare()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#f97316] py-2 text-xs font-semibold text-white disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : null}
          Comparar
        </button>
      )}
      {rows && (
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-2"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-white">{row.label}</p>
                {row.ok ? (
                  <button
                    type="button"
                    className="rounded-lg bg-[#f97316]/20 px-2 py-1 text-[10px] font-semibold text-[#f97316]"
                    onClick={() => {
                      const pts = (row as AlternativeProfile & { _points?: LngLat[] })
                        ._points;
                      if (pts) onApply(row.segmentMode, pts);
                    }}
                  >
                    Aplicar
                  </button>
                ) : (
                  <span className="text-[10px] text-red-300">{row.message}</span>
                )}
              </div>
              <p className="mt-1 text-[10px] text-white/45">
                {row.ok
                  ? `${row.distanceKm} km · ${row.etaMinutes} min · ${row.surfaceHint}`
                  : row.elevHint}
              </p>
            </li>
          ))}
          <button
            type="button"
            onClick={() => void runCompare()}
            disabled={loading}
            className="mt-1 w-full rounded-lg border border-white/10 py-1.5 text-[11px] text-white/60 hover:text-white"
          >
            Volver a comparar
          </button>
        </ul>
      )}
    </div>
  );
}

function estimateKm(pts: LngLat[]): number {
  let d = 0;
  for (let i = 1; i < pts.length; i++) {
    const [lon1, lat1] = pts[i - 1];
    const [lon2, lat2] = pts[i];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    d += R * 2 * Math.asin(Math.sqrt(a));
  }
  return d;
}
