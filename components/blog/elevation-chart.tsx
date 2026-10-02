import { Mountain } from "lucide-react";

interface ElevationChartProps {
  highPointMeters?: number;
  lowPointMeters?: number;
  ascentMeters?: number;
  distanceKm?: number;
  terrainBreakdown?: {
    label: string;
    percent: number;
    color: string;
  }[];
}

export function ElevationChart({
  highPointMeters = 2450,
  lowPointMeters = 420,
  ascentMeters = 3850,
  distanceKm = 240,
  terrainBreakdown = [
    { label: "Pista compacta / Grava", percent: 65, color: "#FF8500" },
    { label: "Pista rota / Piedra", percent: 25, color: "#FF5A1F" },
    { label: "Carretera de enlace", percent: 10, color: "#8BEA00" },
  ],
}: ElevationChartProps) {
  return (
    <div className="my-8 rounded-2xl border border-white/10 bg-[#0d0f12] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF8500]/15 text-[#FF8500]">
            <Mountain size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Perfil Altimétrico Estimado</h4>
            <p className="text-[11px] text-white/50">Datos calculados para navegación off-road</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-white/40 block text-[10px] uppercase font-semibold">Cota Máxima</span>
            <span className="font-bold text-[#FF9D2E]">{highPointMeters.toLocaleString("es-ES")} m</span>
          </div>
          <div>
            <span className="text-white/40 block text-[10px] uppercase font-semibold">Desnivel (+)</span>
            <span className="font-bold text-[#8BEA00]">+{ascentMeters.toLocaleString("es-ES")} m</span>
          </div>
          <div>
            <span className="text-white/40 block text-[10px] uppercase font-semibold">Distancia</span>
            <span className="font-bold text-white">{distanceKm} km</span>
          </div>
        </div>
      </div>

      {/* SVG Elevation Simulation Curve */}
      <div className="relative w-full h-32 sm:h-40 overflow-hidden rounded-xl bg-[#08090b] border border-white/5 p-2">
        <svg
          viewBox="0 0 800 200"
          preserveAspectRatio="none"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="elevationGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF8500" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#FF8500" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#FF8500" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8BEA00" />
              <stop offset="45%" stopColor="#FF8500" />
              <stop offset="75%" stopColor="#FF9D2E" />
              <stop offset="100%" stopColor="#8BEA00" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="50" x2="800" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="0" y1="100" x2="800" y2="100" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
          <line x1="0" y1="150" x2="800" y2="150" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />

          {/* Area Fill */}
          <path
            d="M 0 170 Q 100 150 160 110 T 320 60 T 480 120 T 640 40 T 800 130 L 800 200 L 0 200 Z"
            fill="url(#elevationGrad)"
          />

          {/* Outline Path */}
          <path
            d="M 0 170 Q 100 150 160 110 T 320 60 T 480 120 T 640 40 T 800 130"
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Summit Pinpoint */}
          <circle cx="640" cy="40" r="5" fill="#FF8500" stroke="#FFFFFF" strokeWidth="2" />
          <text x="640" y="25" fill="#FF9D2E" fontSize="12" fontWeight="bold" textAnchor="middle">
            {highPointMeters}m (Puerto cumbre)
          </text>

          {/* Start and End labels */}
          <text x="15" y="190" fill="rgba(255,255,255,0.4)" fontSize="10">
            Km 0 · {lowPointMeters}m
          </text>
          <text x="740" y="190" fill="rgba(255,255,255,0.4)" fontSize="10" textAnchor="end">
            Km {distanceKm}
          </text>
        </svg>
      </div>

      {/* Terrain Composition Bar */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-white/60 mb-2">
          <span className="font-semibold text-white/80">Composición del Terreno</span>
          <span>100% Verificado para Trail</span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-white/5">
          {terrainBreakdown.map((item, idx) => (
            <div
              key={idx}
              style={{ width: `${item.percent}%`, backgroundColor: item.color }}
              className="h-full transition-all"
              title={`${item.label}: ${item.percent}%`}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-white/60">
          {terrainBreakdown.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>
                {item.label} <strong className="text-white">({item.percent}%)</strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
