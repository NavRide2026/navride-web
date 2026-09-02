"use client";

import { useMemo } from "react";

type Props = {
  value: string;
  onChange: (hex: string) => void;
};

function hexToHsv(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16) / 255;
  const g = parseInt(n.slice(2, 4), 16) / 255;
  const b = parseInt(n.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return [h, s * 100, max * 100];
}

function hsvToHex(h: number, s: number, v: number): string {
  s /= 100;
  v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function TrackColorPicker({ value, onChange }: Props) {
  const [h, s, v] = useMemo(() => hexToHsv(value), [value]);

  const setHsv = (nh: number, ns: number, nv: number) => {
    onChange(hsvToHex(nh, ns, Math.max(10, nv)));
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-8 w-full rounded-lg border border-white/15"
        style={{ backgroundColor: value }}
      />
      <label className="text-[10px] text-white/40 uppercase">Matiz</label>
      <input
        type="range"
        min={0}
        max={360}
        value={Math.round(h)}
        onChange={(e) => setHsv(Number(e.target.value), s, v)}
        className="w-full accent-[#FF5A1F]"
      />
      <label className="text-[10px] text-white/40 uppercase">Saturación</label>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(s)}
        onChange={(e) => setHsv(h, Number(e.target.value), v)}
        className="w-full accent-[#FF5A1F]"
      />
      <label className="text-[10px] text-white/40 uppercase">Brillo</label>
      <input
        type="range"
        min={10}
        max={100}
        value={Math.round(v)}
        onChange={(e) => setHsv(h, s, Number(e.target.value))}
        className="w-full accent-[#FF5A1F]"
      />
    </div>
  );
}
