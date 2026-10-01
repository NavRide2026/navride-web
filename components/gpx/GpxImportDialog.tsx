"use client";

import type { ImportDialogState } from "@/lib/gpx-editor/editor-types";

export type ImportChoice =
  | "track"
  | "edit"
  | "snap-road"
  | "snap-trail"
  | "keep-original";

export function GpxImportDialog({
  dialog,
  onChoose,
  onCancel,
}: {
  dialog: ImportDialogState;
  onChoose: (choice: ImportChoice) => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-end md:items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#121212] p-4 shadow-2xl flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-white">Importar GPX</h3>
        <p className="text-[11px] text-white/45 truncate">{dialog.fileName}</p>
        <ul className="text-[11px] text-[#FF9500] space-y-1 max-h-24 overflow-y-auto">
          {dialog.issues.map((issue, index) => (
            <li key={index}>• {issue}</li>
          ))}
        </ul>
        <p className="text-[11px] text-white/50">
          {dialog.geometry.length} puntos detectados
          {dialog.extensions ? " · extensiones NavRide presentes" : ""}
          {dialog.capsule ? " · capsule" : ""}
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onChoose("edit")}
            className="rounded-full bg-[#f97316] py-2.5 text-sm font-semibold text-white"
          >
            IMPORTAR Y EDITAR
          </button>
          <button
            type="button"
            onClick={() => onChoose("snap-road")}
            className="rounded-full border border-white/20 py-2.5 text-sm text-white/80 hover:text-white"
          >
            AJUSTAR A CARRETERAS (copia)
          </button>
          <button
            type="button"
            onClick={() => onChoose("snap-trail")}
            className="rounded-full border border-white/20 py-2.5 text-sm text-white/80 hover:text-white"
          >
            AJUSTAR A PISTAS / SENDERO (copia)
          </button>
          <button
            type="button"
            onClick={() => onChoose("track")}
            className="rounded-full border border-white/20 py-2.5 text-sm text-white/80 hover:text-white"
          >
            IMPORTAR COMO TRACK (fijo)
          </button>
          <button
            type="button"
            onClick={() => onChoose("keep-original")}
            className="rounded-full border border-dashed border-white/25 py-2.5 text-sm text-white/70 hover:text-white"
          >
            CONSERVAR ORIGINAL + EDITAR COPIA
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full py-2 text-sm text-white/40 hover:text-white/70"
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  );
}
