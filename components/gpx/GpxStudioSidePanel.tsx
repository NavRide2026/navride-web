"use client";

import {
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { GpxSidebar } from "@/components/gpx/GpxSidebar";
import type { Segment } from "@/lib/gpx-editor/editor-types";
import type { NavRideCue, NavRideCueSeverity } from "@/lib/route-studio/navride-route/types";
import { CUE_SEVERITY_LABELS_ES } from "@/lib/route-studio/cues";

const COLORS = [
  { label: "Naranja", value: "#f97316" },
  { label: "Rojo", value: "#ef4444" },
  { label: "Verde", value: "#22c55e" },
  { label: "Azul", value: "#3b82f6" },
  { label: "Amarillo", value: "#eab308" },
  { label: "Morado", value: "#a855f7" },
  { label: "Blanco", value: "#e5e7eb" },
];

export function GpxStudioSidePanel({
  collapsed,
  mobileOpen,
  onCloseMobile,
  routeTitle,
  onRouteTitleChange,
  segments,
  activeId,
  onSelectSegment,
  onRenameSegment,
  onDeleteSegment,
  onColorSegment,
  onAddSegment,
  advanced,
  draftBanner,
  onRestoreDraft,
  onDismissDraft,
  uploadMsg,
  onDismissUploadMsg,
  cues,
  selectedCueId,
  onSelectCue,
  onDeleteCue,
  onUpdateCueSeverity,
  cueDraftMessage,
  onCueDraftMessageChange,
  cueDraftSeverity,
  onCueDraftSeverityChange,
  placeNotePending,
  onAddCue,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  routeTitle: string;
  onRouteTitleChange: (value: string) => void;
  segments: Segment[];
  activeId: string;
  onSelectSegment: (id: string) => void;
  onRenameSegment: (id: string, name: string) => void;
  onDeleteSegment: (id: string) => void;
  onColorSegment: (id: string, color: string) => void;
  onAddSegment: () => void;
  advanced: boolean;
  draftBanner: string | null;
  onRestoreDraft: () => void;
  onDismissDraft: () => void;
  uploadMsg: { ok: boolean; text: string } | null;
  onDismissUploadMsg: () => void;
  cues: NavRideCue[];
  selectedCueId: string | null;
  onSelectCue: (id: string | null) => void;
  onDeleteCue: (id: string) => void;
  onUpdateCueSeverity: (id: string, severity: NavRideCueSeverity) => void;
  cueDraftMessage: string;
  onCueDraftMessageChange: (value: string) => void;
  cueDraftSeverity: NavRideCueSeverity;
  onCueDraftSeverityChange: (value: NavRideCueSeverity) => void;
  placeNotePending: boolean;
  onAddCue: () => void;
}) {
  return (
    <GpxSidebar
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      onCloseMobile={onCloseMobile}
    >
      <div className="p-4 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-white">Ruta</h2>
          <p className="text-xs text-white/40 mt-0.5">
            Título, segmentos y notas
          </p>
        </div>

        {draftBanner && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-[#FF9500]/30 bg-[#FF9500]/10 p-3">
            <p className="text-xs text-[#FF9500]">
              Borrador guardado — {draftBanner}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRestoreDraft}
                className="flex-1 rounded-md bg-[#FF9500]/20 px-2 py-1.5 text-xs text-[#FF9500]"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={onDismissDraft}
                className="rounded-md px-2 py-1.5 text-xs text-white/50 hover:text-white/80"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {uploadMsg && (
          <div
            className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2.5 ${
              uploadMsg.ok
                ? "bg-green-500/10 border border-green-500/20 text-green-400"
                : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}
          >
            {uploadMsg.ok ? (
              <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{uploadMsg.text}</span>
            <button
              type="button"
              onClick={onDismissUploadMsg}
              className="text-white/40 hover:text-white/70"
              aria-label="Cerrar mensaje"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/40 uppercase tracking-widest">
            Nombre
          </label>
          <input
            value={routeTitle}
            onChange={(e) => onRouteTitleChange(e.target.value)}
            className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:border-[#f97316]/50"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40 uppercase tracking-widest">
              Segmentos
            </span>
            {advanced && (
              <button
                type="button"
                onClick={onAddSegment}
                className="text-xs text-[#f97316] hover:text-[#fb923c]"
              >
                + Añadir
              </button>
            )}
          </div>
          {segments.map((seg, i) => (
            <div
              key={seg.id}
              className={`rounded-lg border p-2.5 ${
                seg.id === activeId
                  ? "border-[#f97316]/40 bg-[#f97316]/5"
                  : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectSegment(seg.id)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ background: seg.color }}
                  />
                  <input
                    defaultValue={seg.name || `Segmento ${i + 1}`}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={(e) => onRenameSegment(seg.id, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                    disabled={!advanced}
                  />
                  {advanced && segments.length > 1 && (
                    <button
                      type="button"
                      title="Borrar segmento"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSegment(seg.id);
                      }}
                      className="text-white/30 hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </button>
              {advanced && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.label}
                      onClick={() => onColorSegment(seg.id, c.value)}
                      className={`h-4 w-4 rounded-full border ${
                        seg.color === c.value
                          ? "border-white"
                          : "border-transparent"
                      }`}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              )}
              <p className="mt-1 text-[10px] text-white/30">
                {seg.waypoints.length} pts
                {seg.routingFailed ? " · sin ruta" : ""}
              </p>
            </div>
          ))}
        </div>

        {advanced && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-white/40 uppercase tracking-widest">
              Notas
            </span>
            <ul className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {cues.map((c) => (
                <li
                  key={c.cueId}
                  className={`flex items-start gap-2 rounded-md border px-2 py-1.5 ${
                    selectedCueId === c.cueId
                      ? "border-[#f97316]/40 bg-[#f97316]/5"
                      : "border-white/10"
                  }`}
                >
                  <button
                    type="button"
                    className="flex-1 text-left"
                    onClick={() =>
                      onSelectCue(
                        selectedCueId === c.cueId ? null : c.cueId,
                      )
                    }
                  >
                    <p className="text-[11px] text-white/80 line-clamp-2">
                      {c.message}
                    </p>
                    {selectedCueId === c.cueId && (
                      <select
                        value={c.severity}
                        onChange={(e) =>
                          onUpdateCueSeverity(
                            c.cueId,
                            e.target.value as NavRideCueSeverity,
                          )
                        }
                        className="mt-1 w-full rounded-md bg-white/5 border border-white/10 px-1.5 py-1 text-[10px] text-white"
                        aria-label="Tipo de nota"
                      >
                        {(
                          Object.keys(
                            CUE_SEVERITY_LABELS_ES,
                          ) as NavRideCueSeverity[]
                        ).map((s) => (
                          <option key={s} value={s}>
                            {CUE_SEVERITY_LABELS_ES[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  </button>
                  <button
                    type="button"
                    title="Eliminar nota"
                    onClick={() => onDeleteCue(c.cueId)}
                    className="text-white/30 hover:text-red-400 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
              {cues.length === 0 && (
                <li className="text-[11px] text-white/30">
                  Sin notas — escribe un mensaje y colócala en el mapa.
                </li>
              )}
            </ul>
            <select
              value={cueDraftSeverity}
              onChange={(e) =>
                onCueDraftSeverityChange(
                  e.target.value as NavRideCueSeverity,
                )
              }
              className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white"
            >
              {(
                Object.keys(CUE_SEVERITY_LABELS_ES) as NavRideCueSeverity[]
              ).map((s) => (
                <option key={s} value={s}>
                  {CUE_SEVERITY_LABELS_ES[s]}
                </option>
              ))}
            </select>
            <input
              value={cueDraftMessage}
              onChange={(e) => onCueDraftMessageChange(e.target.value)}
              placeholder="Mensaje de la nota…"
              className="rounded-lg bg-white/5 border border-white/10 px-2 py-1.5 text-xs text-white placeholder:text-white/25"
            />
            <button
              type="button"
              onClick={onAddCue}
              disabled={!cueDraftMessage.trim()}
              className={`rounded-lg border text-xs py-1.5 disabled:opacity-30 ${
                placeNotePending
                  ? "border-yellow-400/60 text-yellow-300"
                  : "border-[#FF5A1F]/40 text-[#FF5A1F]"
              }`}
            >
              {placeNotePending
                ? "Pulsa el mapa para colocar…"
                : "Colocar nota"}
            </button>
          </div>
        )}
      </div>
    </GpxSidebar>
  );
}
