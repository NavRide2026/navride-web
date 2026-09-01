"use client";

import { stageToUx, type NavRideCapability } from "@/lib/capabilities/catalog";

/** Panel ligero Route Studio — no inventa hallazgos sin datos. */
export function RouteDoctorPanel({
  pointCount,
  modeLabel,
}: {
  pointCount: number;
  modeLabel: string;
}) {
  const findings: string[] = [];
  if (pointCount < 2) {
    findings.push("No hay geometría suficiente para analizar.");
  } else {
    findings.push(`${pointCount} puntos en el track.`);
    findings.push(`Modo seleccionado: ${modeLabel}.`);
    findings.push(
      "Análisis OSM profundo se completa en la app con grafo local / routing.",
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#101114] p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-white font-medium">Route Doctor</h3>
        <span className="text-[11px] uppercase tracking-wide text-white/50">
          Vista previa web
        </span>
      </div>
      <ul className="text-sm text-white/70 space-y-1">
        {findings.map((f) => (
          <li key={f}>• {f}</li>
        ))}
      </ul>
    </div>
  );
}

export function CapabilityCard({ item }: { item: NavRideCapability }) {
  const ux = stageToUx(item.stage);
  if (ux === "hidden") return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#101114] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-white font-medium">{item.title}</p>
          <p className="text-white/50 text-sm mt-1">{item.shortDescription}</p>
        </div>
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-[#FF9500]">
          {ux}
        </span>
      </div>
      <p className="text-white/40 text-xs mt-3">{item.detailDescription}</p>
      <p className="text-white/25 text-[10px] mt-2">
        Próximamente ≠ Premium
      </p>
    </div>
  );
}
