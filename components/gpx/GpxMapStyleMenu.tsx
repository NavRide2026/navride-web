"use client";

import { Layers } from "lucide-react";
import type { StyleId } from "@/lib/gpx-editor/editor-types";

export function GpxMapStyleMenu({
  open,
  value,
  styles,
  onToggle,
  onChange,
}: {
  open: boolean;
  value: StyleId;
  styles: { id: StyleId; label: string }[];
  onToggle: () => void;
  onChange: (style: StyleId) => void;
}) {
  return (
    <div className="absolute bottom-6 left-3 z-10">
      <div className="relative">
        <button
          onClick={onToggle}
          title="Estilo de mapa"
          className={`w-9 h-9 rounded-lg bg-[#0a0a0a]/90 border flex items-center justify-center transition shadow-lg ${
            open
              ? "border-[#f97316]/40 text-[#f97316]"
              : "border-white/15 text-white/70 hover:text-white"
          }`}
        >
          <Layers size={16} />
        </button>
        {open && (
          <div className="absolute bottom-full mb-2 left-0 bg-[#0a0a0a]/98 border border-white/15 rounded-xl p-1.5 shadow-xl min-w-[100px] backdrop-blur-xl">
            {styles.map((style) => (
              <button
                key={style.id}
                onClick={() => onChange(style.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition ${
                  value === style.id
                    ? "bg-[#f97316]/20 text-[#f97316] font-semibold"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
