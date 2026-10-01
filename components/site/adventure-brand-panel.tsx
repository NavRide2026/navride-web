import { BrandLockup } from "@/components/site/brand-lockup";

export function AdventureBrandPanel() {
  return (
    <div className="adventure-panel">
      <svg className="adventure-panel-map" viewBox="0 0 760 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g className="adventure-contours" fill="none" stroke="currentColor" strokeWidth="1.25">
          <path d="M-60 95C70 4 170 148 292 68s222-44 340 38 210 65 300-10" />
          <path d="M-60 142C82 50 183 195 307 115s224-42 342 42 205 63 292-8" />
          <path d="M-60 192C95 98 198 242 323 163s224-39 341 45 200 62 284-4" />
          <path d="M-60 405C76 310 190 458 312 375s228-45 350 42 196 60 280-5" />
          <path d="M-60 455C91 360 205 507 328 425s230-43 349 42 194 62 270-4" />
          <path d="M-60 505C105 410 218 556 342 476s229-40 345 40 190 63 260 2" />
        </g>
        <path className="adventure-road-glow" d="M-40 485C95 405 148 448 232 362s142-40 220-125 139-62 224 5 146 30 205-42" />
        <path className="adventure-road" d="M-40 485C95 405 148 448 232 362s142-40 220-125 139-62 224 5 146 30 205-42" pathLength="1" />
        <g className="adventure-points">
          <circle cx="232" cy="362" r="7" />
          <circle cx="452" cy="237" r="7" />
          <circle cx="676" cy="242" r="7" />
        </g>
      </svg>

      <div className="adventure-panel-content">
        <p className="adventure-kicker">TRACK · TERRAIN · ADVENTURE</p>
        <BrandLockup size="lg" className="adventure-lockup" />
        <p className="adventure-panel-copy">Planifica el recorrido. Sigue la pista. Conserva el rumbo.</p>
        <div className="adventure-panel-stats" aria-label="Características">
          <span><strong>GPX</strong><small>Rutas</small></span>
          <span><strong>OFF-ROAD</strong><small>Terreno</small></span>
          <span><strong>HUD</strong><small>Navegación</small></span>
        </div>
      </div>
    </div>
  );
}
