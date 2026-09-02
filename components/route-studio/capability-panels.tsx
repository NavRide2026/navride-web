"use client";

import { stageToUx, type NavRideCapability } from "@/lib/capabilities/catalog";
import type { RouteHealthReport } from "@/lib/route-studio/route-health";

/** Panel Route Doctor — usa analyzeRouteHealth (sin stub de hallazgos inventados). */
export function RouteDoctorPanel({
  report,
  modeLabel,
  pointCount,
}: {
  report: RouteHealthReport;
  modeLabel: string;
  pointCount: number;
}) {
  const healthClass =
    report.health === "GOOD"
      ? "text-green-400"
      : report.health === "REVIEW"
        ? "text-[#FF9500]"
        : "text-red-400";

  return (
    <div className="rounded-xl border border-white/10 bg-[#101114] p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-white font-medium">Route Doctor</h3>
        <span className={`text-[11px] uppercase tracking-wide font-semibold ${healthClass}`}>
          {report.health}
        </span>
      </div>
      <p className="text-xs text-white/40">
        {pointCount} pts · Modo {modeLabel}
      </p>
      {report.issues.length === 0 && report.warnings.length === 0 ? (
        <p className="text-sm text-white/70">Sin hallazgos — geometría coherente.</p>
      ) : (
        <ul className="text-sm text-white/70 space-y-1">
          {report.issues.map((f) => (
            <li key={`i-${f}`} className="text-red-300">
              • {f}
            </li>
          ))}
          {report.warnings.map((f) => (
            <li key={`w-${f}`} className="text-[#FF9500]">
              • {f}
            </li>
          ))}
        </ul>
      )}
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
