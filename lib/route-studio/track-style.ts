/** Contraste de track: casing + núcleo; brillo HSV mínimo. */

export const DEFAULT_TRACK_WIDTH = 5.5;
export const DEFAULT_TRACK_OPACITY = 0.98;
export const MIN_HSV_BRIGHTNESS = 10;
export const HISTORY_CAP = 50;

export function casingWidth(coreWidth: number): number {
  return Math.max(coreWidth + 3.5, coreWidth * 1.65);
}

export function casingOpacity(coreOpacity: number, satellite: boolean): number {
  const base = Math.min(1, coreOpacity * (satellite ? 0.85 : 0.55));
  return Math.max(0.35, base);
}

export function casingColor(satellite: boolean): string {
  return satellite ? "#000000" : "#0a0a0a";
}

export function clampTrackWidth(w: number): number {
  return Math.min(14, Math.max(2, w));
}

export function clampTrackOpacity(o: number): number {
  return Math.min(1, Math.max(0.35, o));
}

export function ensureMinBrightness(hex: string, minV = MIN_HSV_BRIGHTNESS): string {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
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
  const s = max === 0 ? 0 : (d / max) * 100;
  let v = max * 100;
  if (v >= minV) return hex;
  v = minV;
  const ss = s / 100;
  const vv = v / 100;
  const c = vv * ss;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vv - c;
  let rr = 0,
    gg = 0,
    bb = 0;
  if (h < 60) [rr, gg, bb] = [c, x, 0];
  else if (h < 120) [rr, gg, bb] = [x, c, 0];
  else if (h < 180) [rr, gg, bb] = [0, c, x];
  else if (h < 240) [rr, gg, bb] = [0, x, c];
  else if (h < 300) [rr, gg, bb] = [x, 0, c];
  else [rr, gg, bb] = [c, 0, x];
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to(rr)}${to(gg)}${to(bb)}`;
}
