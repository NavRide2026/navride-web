"use client";

import { X } from "lucide-react";
import type { RouteHealthReport } from "@/lib/route-studio/route-health";
import {
  SURFACE_LABELS,
  type RouteAnalysis,
  type SurfaceBucket,
} from "@/lib/gpx-editor/route-analysis";

export function GpxRouteAnalysisPanel({
  analysis,
  health,
  modeLabel,
  pointCount,
  onClose,
}: {
  analysis: RouteAnalysis;
  health: RouteHealthReport;
  modeLabel: string;
  pointCount: number;
  onClose: () => void;
}) {
  const healthClass =
    health.health === "GOOD"
      ? "text-green-400"
      : health.health === "REVIEW"
        ? "text-[#FF9500]"
        : health.health === "DRAFT"
          ? "text-white/50"
          : "text-red-400";

  const surfaceEntries = (
    Object.entries(analysis.surfaces) as [SurfaceBucket, number][]
  ).filter(([, km]) => km > 0.01);

  return (
    <div className="absolute bottom-20 right-3 z-20 w-[min(300px,calc(100vw-24px))] max-h-[min(70vh,480px)] overflow-y-auto rounded-2xl border border-white/15 bg-[#0a0a0a]/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-white">Análisis de ruta</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar análisis"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2 text-[11px]">
        <Stat label="Distancia" value={`${analysis.distanceKm.toFixed(2)} km`} />
        <Stat label="Tiempo est." value={`${analysis.etaMinutes} min`} />
        <Stat
          label="Desnivel +"
          value={analysis.elevGainM != null ? `${analysis.elevGainM} m` : "n/d"}
        />
        <Stat
          label="Desnivel −"
          value={analysis.elevLossM != null ? `${analysis.elevLossM} m` : "n/d"}
        />
        <Stat
          label="Alt. mín"
          value={analysis.elevMinM != null ? `${analysis.elevMinM} m` : "n/d"}
        />
        <Stat
          label="Alt. máx"
          value={analysis.elevMaxM != null ? `${analysis.elevMaxM} m` : "n/d"}
        />
        <Stat
          label="Pendiente"
          value={
            analysis.avgGradePct != null ? `${analysis.avgGradePct}%` : "n/d"
          }
        />
        <Stat label="Puntos" value={`${pointCount}`} />
      </div>

      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/35">
        Superficies / tipos
      </p>
      {surfaceEntries.length === 0 ? (
        <p className="mb-3 text-[11px] text-white/45">Sin geometría aún.</p>
      ) : (
        <ul className="mb-3 space-y-1 text-[11px] text-white/75">
          {surfaceEntries.map(([key, km]) => (
            <li key={key} className="flex justify-between gap-2">
              <span>{SURFACE_LABELS[key]}</span>
              <span className="text-white/45">{km.toFixed(2)} km</span>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Route Doctor
          </p>
          <span className={`text-[10px] font-semibold uppercase ${healthClass}`}>
            {health.health}
          </span>
        </div>
        <p className="mb-1 text-[10px] text-white/40">
          {pointCount} pts · {modeLabel}
        </p>
        {health.userMessage && (
          <p className="text-[11px] text-white/60">{health.userMessage}</p>
        )}
        {health.issues.length === 0 && health.warnings.length === 0 ? (
          !health.userMessage && (
            <p className="text-[11px] text-white/70">Sin hallazgos.</p>
          )
        ) : (
          <ul className="space-y-1 text-[11px]">
            {health.issues.map((issue) => (
              <li key={`i-${issue}`} className="text-red-300">
                • {issue}
              </li>
            ))}
            {health.warnings.map((warning) => (
              <li key={`w-${warning}`} className="text-[#FF9500]">
                • {warning}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-white/35">{label}</p>
      <p className="text-xs font-medium text-white/90">{value}</p>
    </div>
  );
}
