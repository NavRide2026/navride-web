export function RouteMotionBackground() {
  return (
    <div className="route-motion" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <g className="route-topography" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M-80 145C105 18 248 238 430 105S770 35 955 160s382 120 720-55" />
          <path d="M-80 205C120 72 270 300 452 160S795 92 980 215s390 120 700-45" />
          <path d="M-80 270C140 120 285 355 475 220S820 150 1008 278s382 110 680-40" />
          <path d="M-90 625C100 485 270 715 455 580s355-80 548 55 385 110 690-60" />
          <path d="M-90 690C120 545 292 772 478 640s350-78 545 48 385 120 680-55" />
          <path d="M-90 755C138 610 315 830 500 705s352-72 548 45 370 125 660-45" />
        </g>

        <path
          className="route-track-shadow"
          d="M-90 760C120 610 230 675 362 580s212-58 320-165 205-125 330-38 207 37 310-65 190-78 365 20"
          pathLength="1"
        />
        <path
          className="route-track"
          d="M-90 760C120 610 230 675 362 580s212-58 320-165 205-125 330-38 207 37 310-65 190-78 365 20"
          pathLength="1"
        />

        <g className="route-waypoints">
          <circle cx="362" cy="580" r="9" />
          <circle cx="682" cy="415" r="9" />
          <circle cx="1012" cy="377" r="9" />
          <circle cx="1322" cy="312" r="9" />
        </g>
      </svg>
    </div>
  );
}
