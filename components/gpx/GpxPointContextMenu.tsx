"use client";

export type PointMenuAction =
  | "delete"
  | "insertAfter"
  | "toggleShaping"
  | "splitHere";

export function GpxPointContextMenu({
  x,
  y,
  pointIndex,
  totalPoints,
  isShaping,
  advanced,
  onAction,
  onClose,
}: {
  x: number;
  y: number;
  pointIndex: number;
  totalPoints: number;
  isShaping: boolean;
  advanced: boolean;
  onAction: (action: PointMenuAction) => void;
  onClose: () => void;
}) {
  const left = Math.min(Math.max(8, x), typeof window !== "undefined" ? window.innerWidth - 200 : x);
  const top = Math.min(Math.max(8, y), typeof window !== "undefined" ? window.innerHeight - 220 : y);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[210] cursor-default bg-transparent"
        aria-label="Cerrar menú de punto"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        role="menu"
        className="fixed z-[220] min-w-[180px] rounded-xl border border-white/15 bg-[#0a0a0a]/98 p-1.5 shadow-2xl backdrop-blur-xl"
        style={{ left, top }}
      >
        <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/35">
          Punto {pointIndex + 1} / {totalPoints}
        </p>
        <button
          type="button"
          role="menuitem"
          className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs text-red-300 hover:bg-white/8"
          onClick={() => onAction("delete")}
        >
          Eliminar punto
        </button>
        {advanced && (
          <button
            type="button"
            role="menuitem"
            className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/80 hover:bg-white/8"
            onClick={() => onAction("insertAfter")}
          >
            Insertar punto después
          </button>
        )}
        {advanced && (
          <button
            type="button"
            role="menuitem"
            className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/80 hover:bg-white/8"
            onClick={() => onAction("toggleShaping")}
          >
            {isShaping ? "Marcar como vía (via)" : "Marcar como shaping"}
          </button>
        )}
        {advanced && pointIndex > 0 && pointIndex < totalPoints - 1 && (
          <button
            type="button"
            role="menuitem"
            className="flex w-full rounded-lg px-2.5 py-2 text-left text-xs text-white/80 hover:bg-white/8"
            onClick={() => onAction("splitHere")}
          >
            Dividir segmento aquí
          </button>
        )}
      </div>
    </>
  );
}
