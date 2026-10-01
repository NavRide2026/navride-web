export function ImmersiveBackdrop() {
  return (
    <div className="immersive-backdrop" aria-hidden="true">
      <div className="immersive-light immersive-light-orange" />
      <div className="immersive-light immersive-light-green" />
      <svg viewBox="0 0 1600 1200" preserveAspectRatio="xMidYMid slice">
        <g className="immersive-contours" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M-100 120C130-50 260 250 490 86s420-40 610 114 370 80 620-70" />
          <path d="M-100 190C150 10 280 315 510 150s420-35 610 120 370 80 620-65" />
          <path d="M-100 270C170 75 305 380 535 218s414-30 605 125 365 85 615-55" />
          <path d="M-100 760C120 590 280 880 500 730s420-45 610 105 380 100 620-55" />
          <path d="M-100 840C145 650 300 950 525 798s415-42 608 110 375 100 615-50" />
          <path d="M-100 925C165 725 325 1020 550 870s410-38 600 112 365 100 610-42" />
          <path d="M120 420c90-115 250-110 330 8s-15 250-150 260S40 575 120 420Z" />
          <path d="M175 450c65-80 175-75 232 8s-12 172-106 180-184-79-126-188Z" />
          <path d="M1160 375c100-120 265-105 338 20s-35 255-170 250-260-110-168-270Z" />
        </g>
        <path className="immersive-route-glow" d="M-80 1060C180 930 260 1000 420 820s260-78 410-260 275-115 430-5 255 62 430-120" />
        <path className="immersive-route" pathLength="1" d="M-80 1060C180 930 260 1000 420 820s260-78 410-260 275-115 430-5 255 62 430-120" />
        <g className="immersive-route-points">
          <circle cx="420" cy="820" r="8" />
          <circle cx="830" cy="560" r="8" />
          <circle cx="1260" cy="555" r="8" />
        </g>
      </svg>
      <div className="immersive-vignette" />
    </div>
  );
}
