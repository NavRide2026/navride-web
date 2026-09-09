"use client";

import { AlertTriangle, Loader2, MapPin } from "lucide-react";
import type { CompatibilityAudit, CompatibilityIssue } from "@/lib/route-studio/route-compatibility-audit";
import {
  modeNounEs,
  type CompatibilityClass,
  type CompatibilityResult,
} from "@/lib/route-studio/route-compatibility";
import type { TransportMode } from "@/lib/route-studio/routing";
import type { WayHit } from "@/lib/route-studio/route-compatibility-snap";

export type CompatPrompt = {
  hit: WayHit;
  nearbyCompatible: WayHit | null;
};

function clsLabel(cls: CompatibilityClass): string {
  return {
    COMPATIBLE: "Compatible",
    WARNING: "Advertencia",
    RESTRICTED: "Restricción",
    INCOMPATIBLE: "Prohibición",
    UNKNOWN: "Desconocido",
  }[cls];
}

export function CompatibilityPromptCard({
  prompt,
  mode,
  onViewMap,
  onFindAlt,
  onCancel,
  findingAlt,
}: {
  prompt: CompatPrompt;
  mode: TransportMode;
  onViewMap: () => void;
  onFindAlt: () => void;
  onCancel: () => void;
  findingAlt: boolean;
}) {
  const c = prompt.hit.classification;
  return (
    <div className="rounded-xl border border-[#FF9500]/40 bg-[#121214] p-3 text-xs text-white shadow-xl">
      <p className="flex items-center gap-1.5 font-semibold text-[#FF9500]">
        <AlertTriangle size={14} />
        Vía detectada · No permitida para {modeNounEs(mode)}
      </p>
      <p className="mt-2 text-white/70 leading-snug">{c.reason}</p>
      <p className="mt-2 text-[10px] text-white/40 uppercase tracking-widest">
        {c.wayTypeLabel} · {clsLabel(c.cls)}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-1.5">
        <button
          type="button"
          onClick={onViewMap}
          className="rounded-lg border border-white/15 py-2 text-white/80 hover:text-white"
        >
          Ver en mapa
        </button>
        <button
          type="button"
          onClick={onFindAlt}
          disabled={findingAlt}
          className="rounded-lg border border-[#FF5A1F]/40 bg-[#FF5A1F]/10 py-2 text-[#FF5A1F] disabled:opacity-30"
        >
          {findingAlt ? "Buscando…" : "Buscar alternativa"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg py-2 text-white/45 hover:text-white/70"
        >
          Cancelar punto
        </button>
      </div>
      <p className="mt-2 text-[10px] text-white/35 leading-snug">
        Según la información cartográfica disponible. No sustituye señalización real.
      </p>
    </div>
  );
}

export function WayInfoCard({ result }: { result: CompatibilityResult }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-2.5 text-[11px] text-white/80 space-y-1">
      <Row k="Tipo" v={result.wayTypeLabel} />
      <Row k="Superficie" v={result.surfaceLabel} />
      <Row k="Moto" v={result.permits.moto} />
      <Row k="Coche" v={result.permits.car} />
      <Row k="Bici" v={result.permits.bike} />
      <Row k="Peatón" v={result.permits.walk} />
      <Row k="Acceso" v={result.accessLabel} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-white/40 uppercase tracking-wide">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

export function RouteCompatibilityReview({
  audit,
  loading,
  onReview,
  onSelectIssue,
  onKeep,
  onFindAlt,
  onEdit,
  onBack,
  selected,
}: {
  audit: CompatibilityAudit | null;
  loading: boolean;
  onReview: () => void;
  onSelectIssue: (issue: CompatibilityIssue) => void;
  onKeep: () => void;
  onFindAlt: () => void;
  onEdit: () => void;
  onBack: () => void;
  selected: CompatibilityIssue | null;
}) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onReview}
        disabled={loading}
        className="flex items-center justify-center gap-2 rounded-full border border-white/15 py-2.5 text-sm text-white/80 hover:text-white"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
        Revisar ruta
      </button>

      {audit && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white">
          <p className="font-semibold">Revisión de ruta</p>
          <p className="mt-1 text-white/70">
            {audit.analyzedKm >= 1
              ? `✓ ${audit.analyzedKm.toFixed(1)} km analizados`
              : `✓ ${(audit.analyzedKm * 1000).toFixed(0)} m analizados`}
          </p>
          <p className={`mt-1 ${audit.issueCount ? "text-[#FF9500]" : "text-green-400"}`}>
            {audit.issueCount === 0
              ? "Sin incidencias según la cartografía disponible"
              : `⚠ ${audit.issueCount} incidencia${audit.issueCount === 1 ? "" : "s"}`}
          </p>
          <div className="mt-2 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
            {audit.issues.map((iss) => (
              <button
                key={iss.id}
                type="button"
                onClick={() => onSelectIssue(iss)}
                className={`text-left rounded-lg px-2 py-1.5 border ${
                  selected?.id === iss.id
                    ? "border-[#FF5A1F]/50 bg-[#FF5A1F]/10"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <span className="text-white/50">{iss.startKm.toFixed(1)} km</span>
                <span className="block text-white/85 leading-snug">{iss.reason}</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-white/35 leading-snug">{audit.disclaimer}</p>
        </div>
      )}

      {selected && (
        <div className="rounded-xl border border-[#FF9500]/30 p-3 text-xs text-white space-y-1.5">
          <p className="flex items-center gap-1 font-semibold text-[#FF9500]">
            <MapPin size={12} /> {selected.wayTypeLabel}
          </p>
          <WayInfoCard result={selected.classification} />
          <button
            type="button"
            onClick={onFindAlt}
            className="w-full rounded-lg border border-[#FF5A1F]/40 py-2 text-[#FF5A1F]"
          >
            Buscar alternativa
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="w-full rounded-lg border border-white/15 py-2 text-white/80"
          >
            Editar ruta
          </button>
          <button
            type="button"
            onClick={onKeep}
            className="w-full rounded-lg border border-white/15 py-2 text-white/70"
          >
            Mantener tramo
          </button>
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-lg py-2 text-white/45 hover:text-white/70"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
}

export function CompatibilityAltPreview({
  onAccept,
  onDismiss,
}: {
  onAccept: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="rounded-xl border border-green-500/30 bg-[#121214] p-3 text-xs text-white space-y-2">
      <p className="font-semibold text-green-400">Alternativa propuesta</p>
      <p className="text-white/60 leading-snug">
        Según la cartografía, hay una vía compatible cercana. No se aplica sola: revisa el trazado verde y acepta si encaja.
      </p>
      <button
        type="button"
        onClick={onAccept}
        className="w-full rounded-lg bg-green-600/80 py-2 font-medium"
      >
        Aceptar alternativa
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="w-full rounded-lg py-2 text-white/45"
      >
        Descartar
      </button>
    </div>
  );
}

export function CompatibilityDataGapCard({
  onPlaceUnchecked,
  onCancel,
}: {
  onPlaceUnchecked: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-xl border border-[#94a3b8]/40 bg-[#121214] p-3 text-xs text-white shadow-xl">
      <p className="flex items-center gap-1.5 font-semibold text-[#eab308]">
        <AlertTriangle size={14} />
        No se pudo comprobar este tramo
      </p>
      <p className="mt-2 text-white/70 leading-snug">
        Según la información cartográfica disponible, NavRide no ha podido leer las vías de esta zona. No se asume que el tramo sea válido para el modo activo.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-1.5">
        <button
          type="button"
          onClick={onPlaceUnchecked}
          className="rounded-lg border border-white/15 py-2 text-white/80"
        >
          Colocar sin comprobar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg py-2 text-white/45 hover:text-white/70"
        >
          Cancelar punto
        </button>
      </div>
    </div>
  );
}
