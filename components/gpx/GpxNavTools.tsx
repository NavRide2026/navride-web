"use client";

import { Compass, DoorOpen, Loader2, Maximize2, Navigation } from "lucide-react";

export function GpxNavTools({
  locating,
  canFit,
  showExit,
  onLocate,
  onFit,
  onResetNorth,
  onExit,
}: {
  locating: boolean;
  canFit: boolean;
  showExit: boolean;
  onLocate: () => void;
  onFit: () => void;
  onResetNorth: () => void;
  onExit?: () => void;
}) {
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
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
  );
}
