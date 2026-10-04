"use client";

import { Compass, DoorOpen, Loader2, Maximize2, Navigation, SlidersHorizontal, X } from "lucide-react";

export function GpxNavTools({
  locating,
  mobileOpen,
  onToggleMobile,
  canFit,
  showExit,
  onLocate,
  onFit,
  onResetNorth,
  onExit,
}: {
  locating: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  canFit: boolean;
  showExit: boolean;
  onLocate: () => void;
  onFit: () => void;
  onResetNorth: () => void;
  onExit?: () => void;
}) {
  return (
    <div className="absolute right-3 top-16 z-30 flex flex-col items-end gap-1.5 md:top-3">
      <button
        type="button"
        onClick={onToggleMobile}
        title={mobileOpen ? "Cerrar acciones del mapa" : "Acciones del mapa"}
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-[#0a0a0a]/95 text-white/80 shadow-xl backdrop-blur-xl md:hidden"
        aria-label={mobileOpen ? "Cerrar acciones del mapa" : "Abrir acciones del mapa"}
        aria-expanded={mobileOpen}
      >
        {mobileOpen ? <X size={20} /> : <SlidersHorizontal size={20} />}
      </button>
      <div className={`${mobileOpen ? "flex" : "hidden"} flex-col gap-1.5 md:flex`}>
      <button
        type="button"
        onClick={onLocate}
        title="Mi ubicación GPS"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0a0a0a]/90 text-white/70 shadow-lg transition hover:text-[#3b82f6]"
        aria-label="Mi ubicación GPS"
      >
        {locating ? (
          <Loader2 size={15} className="animate-spin text-[#3b82f6]" />
        ) : (
          <Navigation size={15} />
        )}
      </button>
      <button
        type="button"
        onClick={onFit}
        title="Ajustar vista a la ruta"
        disabled={!canFit}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0a0a0a]/90 text-white/70 shadow-lg transition hover:text-white disabled:opacity-30"
        aria-label="Ajustar vista a la ruta"
      >
        <Maximize2 size={15} />
      </button>
      <button
        type="button"
        onClick={onResetNorth}
        title="Orientar al norte"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0a0a0a]/90 text-white/70 shadow-lg transition hover:text-white"
        aria-label="Orientar al norte"
      >
        <Compass size={15} />
      </button>
      {showExit && onExit && (
        <button
          type="button"
          onClick={onExit}
          title="Salir del editor"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-[#0a0a0a]/90 text-white/70 shadow-lg transition hover:text-[#f97316]"
          aria-label="Salir del editor"
        >
          <DoorOpen size={15} />
        </button>
      )}
      </div>
    </div>
  );
}
