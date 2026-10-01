"use client";

import { X } from "lucide-react";

export type WayInspectorData = {
  name: string;
  type: string;
  surface: string;
  tracktype: string;
  smoothness: string;
  access: string;
  motorcycle: string;
  bicycle: string;
  foot: string;
  difficulty: string;
  slope: string;
  ref: string;
};

function row(label: string, value: string) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 py-1.5 text-[11px]">
      <span className="text-white/40">{label}</span>
      <span className="max-w-[55%] text-right text-white/85">{value || "—"}</span>
    </div>
  );
}

export function GpxWayInspector({
  data,
  onClose,
}: {
  data: WayInspectorData;
  onClose: () => void;
}) {
  return (
    <div className="absolute bottom-20 left-3 z-20 w-[min(280px,calc(100vw-24px))] rounded-2xl border border-white/15 bg-[#0a0a0a]/95 p-3 shadow-2xl backdrop-blur-xl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold text-white">Inspector de vía</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar inspector"
        >
          <X size={14} />
        </button>
      </div>
      {row("Nombre", data.name)}
      {row("Tipo", data.type)}
      {row("Superficie", data.surface)}
      {row("Tracktype", data.tracktype)}
      {row("Smoothness", data.smoothness)}
      {row("Acceso", data.access)}
      {row("Moto", data.motorcycle)}
      {row("Bici", data.bicycle)}
      {row("Pie", data.foot)}
      {row("Dificultad", data.difficulty)}
      {row("Pendiente", data.slope)}
      {row("Referencia", data.ref)}
    </div>
  );
}

export function propsToWayInspector(
  props: Record<string, unknown> | null | undefined,
  layerId?: string,
): WayInspectorData {
  const p = props ?? {};
  const str = (keys: string[]) => {
    for (const k of keys) {
      const v = p[k];
      if (v != null && String(v).trim()) return String(v);
    }
    return "";
  };
  const className = str(["class", "highway", "type", "subclass"]);
  return {
    name: str(["name", "name:es", "name_en"]),
    type: className || layerId || "vía",
    surface: str(["surface"]),
    tracktype: str(["tracktype"]),
    smoothness: str(["smoothness"]),
    access: str(["access", "motor_vehicle"]),
    motorcycle: str(["motorcycle", "motor_vehicle"]),
    bicycle: str(["bicycle"]),
    foot: str(["foot", "pedestrian"]),
    difficulty: str(["mtb_scale", "sac_scale", "difficulty"]),
    slope: str(["incline", "slope", "ele"]),
    ref: str(["ref", "route_ref"]),
  };
}
