"use client";

import { Layers, Redo2, Trash2, Undo2, Wrench, X } from "lucide-react";
import type { StyleId } from "@/lib/gpx-editor/editor-types";

export function GpxFloatingToolbar({
  embedNavRideApp,
  mobileOpen,
  onToggleMobile,
  canClear,
  canUndo,
  canRedo,
  styleMenuOpen,
  mapStyleId,
  styles,
  onClear,
  onUndo,
  onRedo,
  onToggleStyleMenu,
  onChangeStyle,
}: {
  embedNavRideApp: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  canClear: boolean;
  canUndo: boolean;
  canRedo: boolean;
  styleMenuOpen: boolean;
  mapStyleId: StyleId;
  styles: { id: StyleId; label: string }[];
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleStyleMenu: () => void;
  onChangeStyle: (style: StyleId) => void;
}) {
  return (
    <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onToggleMobile}
        title={mobileOpen ? "Cerrar edición rápida" : "Edición rápida"}
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-[#0a0a0a]/95 text-white/80 shadow-xl backdrop-blur-xl md:hidden"
        aria-label={mobileOpen ? "Cerrar edición rápida" : "Abrir edición rápida"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <Wrench size={20} />}
      </button>
      <div className={`${mobileOpen ? "flex" : "hidden"} flex-col gap-1.5 md:flex`}>
      <button
        type="button"
        onClick={onClear}
        title="Borrar segmento activo"
        disabled={!canClear}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0a0a0a]/90 text-white/70 shadow-lg transition hover:text-red-400 disabled:opacity-30"
        aria-label="Borrar segmento activo"
      >
        <Trash2 size={15} />
      </button>
      <button
        type="button"
        onClick={onUndo}
        title={embedNavRideApp ? "Deshacer último punto" : "Deshacer (Ctrl+Z)"}
        disabled={!canUndo}
        className={`flex items-center justify-center rounded-lg border border-white/15 bg-[#0a0a0a]/90 text-white/70 shadow-lg transition hover:text-white disabled:opacity-30 ${
          embedNavRideApp ? "h-9 min-w-9 gap-1.5 px-2.5" : "h-9 w-9"
        }`}
        aria-label="Deshacer último punto"
      >
        <Undo2 size={15} />
        {embedNavRideApp && (
          <span className="whitespace-nowrap pr-0.5 text-[10px] font-medium">
            Deshacer último punto
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={onRedo}
        title={embedNavRideApp ? "Rehacer" : "Rehacer (Ctrl+Y)"}
        disabled={!canRedo}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0a0a0a]/90 text-white/70 shadow-lg transition hover:text-white disabled:opacity-30"
        aria-label="Rehacer"
      >
        <Redo2 size={15} />
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={onToggleStyleMenu}
          title="Estilo de mapa"
          className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-[#0a0a0a]/90 shadow-lg transition ${
            styleMenuOpen
              ? "border-[#f97316]/40 text-[#f97316]"
              : "border-white/15 text-white/70 hover:text-white"
          }`}
          aria-label="Capas del mapa"
          aria-expanded={styleMenuOpen}
        >
          <Layers size={16} />
        </button>
        {styleMenuOpen && (
          <div className="absolute left-full top-0 ml-2 min-w-[100px] rounded-xl border border-white/15 bg-[#0a0a0a]/98 p-1.5 shadow-xl backdrop-blur-xl">
            {styles.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => onChangeStyle(style.id)}
                className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition ${
                  mapStyleId === style.id
                    ? "bg-[#f97316]/20 font-semibold text-[#f97316]"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
