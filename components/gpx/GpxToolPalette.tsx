"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Activity,
  Bike,
  Car,
  Check,
  Cloud,
  DoorOpen,
  Download,
  Footprints,
  GitBranch,
  GitMerge,
  Layers,
  List,
  MapPin,
  Motorbike,
  Plus,
  Route,
  Search,
  Smartphone,
  Sparkles,
  Split,
  Upload,
  Waypoints,
  X,
} from "lucide-react";
import type { TransportMode } from "@/lib/route-studio/routing";
import type { RouteSegmentMode } from "@/lib/route-studio/segment-routing-mode";
import type { EditorMode } from "@/lib/route-studio/mode-capabilities";

const STORAGE_KEY = "navride:gpx-tool-wheel-position-v1";
const BUTTON_SIZE = 64;
const EDGE = 14;

type Point = { x: number; y: number };

type PaletteAction = {
  section: string;
  label: string;
  icon: typeof MapPin;
  action: () => void;
  disabled?: boolean;
  active?: boolean;
};

function clampPosition(point: Point): Point {
  if (typeof window === "undefined") return point;
  return {
    x: Math.min(
      Math.max(EDGE, point.x),
      Math.max(EDGE, window.innerWidth - BUTTON_SIZE - EDGE),
    ),
    y: Math.min(
      Math.max(EDGE, point.y),
      Math.max(EDGE, window.innerHeight - BUTTON_SIZE - EDGE),
    ),
  };
}

function defaultPosition(): Point {
  if (typeof window === "undefined") return { x: 24, y: 120 };
  return clampPosition({
    x: window.innerWidth - BUTTON_SIZE - 24,
    y: window.innerHeight - BUTTON_SIZE - 28,
  });
}

function initialPosition(): Point {
  let next = defaultPosition();
  if (typeof window === "undefined") return next;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return next;
    const saved = JSON.parse(raw) as Partial<Point>;
    if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      next = clampPosition({
        x: Number(saved.x),
        y: Number(saved.y),
      });
    }
  } catch {
    // Local storage is optional; use the default position.
  }
  return next;
}

const TRANSPORT_ICONS: Record<TransportMode, typeof MapPin> = {
  walk: Footprints,
  bike: Bike,
  moto: Motorbike,
  car: Car,
};

export function GpxToolPalette({
  editorMode,
  transportMode,
  segmentMode,
  onLayers,
  onSave,
  onImport,
  onExport,
  onLaunch,
  onExit,
  onAddSegment,
  onSplitSegment,
  onJoinSegment,
  onReverseRoute,
  onCloseLoop,
  onInsertMode,
  onShowAnalysis,
  onShowAlternatives,
  onToggleInspect,
  inspectMode,
  onOpenRoutePanel,
  onEditorModeChange,
  onTransportChange,
  onSegmentModeChange,
  canSave,
  canExport,
  canLaunch,
  canAddSegment,
  canSplit,
  canJoin,
  canReverse,
  canCloseLoop,
  canInsert,
  showExit,
}: {
  editorMode: EditorMode;
  transportMode: TransportMode;
  segmentMode: RouteSegmentMode;
  onLayers: () => void;
  onSave: () => void;
  onImport: () => void;
  onExport: () => void;
  onLaunch: () => void;
  onExit?: () => void;
  onAddSegment: () => void;
  onSplitSegment: () => void;
  onJoinSegment: () => void;
  onReverseRoute: () => void;
  onCloseLoop: () => void;
  onInsertMode: () => void;
  onShowAnalysis: () => void;
  onShowAlternatives: () => void;
  onToggleInspect: () => void;
  inspectMode: boolean;
  onOpenRoutePanel: () => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onTransportChange: (mode: TransportMode) => void;
  onSegmentModeChange: (mode: RouteSegmentMode) => void;
  canSave: boolean;
  canExport: boolean;
  canLaunch: boolean;
  canAddSegment: boolean;
  canSplit: boolean;
  canJoin: boolean;
  canReverse: boolean;
  canCloseLoop: boolean;
  canInsert: boolean;
  showExit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Point>(initialPosition);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: Point;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const onResize = () => {
      setPosition((current) => clampPosition(current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    } catch {
      // Ignore storage quota/privacy mode.
    }
  }, [position]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const actions = useMemo<PaletteAction[]>(
    () => {
      const list: PaletteAction[] = [
        {
          section: "Edición",
          label: "Básico",
          icon: Sparkles,
          action: () => onEditorModeChange("simple"),
          active: editorMode === "simple",
        },
        {
          section: "Edición",
          label: "Avanzado",
          icon: Waypoints,
          action: () => onEditorModeChange("advanced"),
          active: editorMode === "advanced",
        },
        {
          section: "Edición",
          label: "Nuevo segmento",
          icon: Plus,
          action: onAddSegment,
          disabled: !canAddSegment,
        },
        {
          section: "Edición",
          label: "Insertar entre puntos",
          icon: Split,
          action: onInsertMode,
          disabled: !canInsert,
        },
        {
          section: "Edición",
          label: "Dividir segmento",
          icon: GitBranch,
          action: onSplitSegment,
          disabled: !canSplit,
        },
        {
          section: "Edición",
          label: "Unir con siguiente",
          icon: GitMerge,
          action: onJoinSegment,
          disabled: !canJoin,
        },
        {
          section: "Edición",
          label: "Invertir ruta",
          icon: Route,
          action: onReverseRoute,
          disabled: !canReverse,
        },
        {
          section: "Edición",
          label: "Cerrar circuito",
          icon: GitMerge,
          action: onCloseLoop,
          disabled: !canCloseLoop,
        },
        {
          section: "Actividad",
          label: "Caminar",
          icon: TRANSPORT_ICONS.walk,
          action: () => onTransportChange("walk"),
          active: transportMode === "walk",
        },
        {
          section: "Actividad",
          label: "Bici",
          icon: TRANSPORT_ICONS.bike,
          action: () => onTransportChange("bike"),
          active: transportMode === "bike",
        },
        {
          section: "Actividad",
          label: "Moto",
          icon: TRANSPORT_ICONS.moto,
          action: () => onTransportChange("moto"),
          active: transportMode === "moto",
        },
        {
          section: "Actividad",
          label: "Coche",
          icon: TRANSPORT_ICONS.car,
          action: () => onTransportChange("car"),
          active: transportMode === "car",
        },
        {
          section: "Modo del tramo",
          label: "Seguir carretera",
          icon: Route,
          action: () => onSegmentModeChange("FOLLOW_ROAD"),
          active: segmentMode === "FOLLOW_ROAD",
        },
        {
          section: "Modo del tramo",
          label: "Seguir caminos",
          icon: Footprints,
          action: () => onSegmentModeChange("FOLLOW_TRAIL"),
          active: segmentMode === "FOLLOW_TRAIL",
        },
        {
          section: "Modo del tramo",
          label: "Línea directa",
          icon: MapPin,
          action: () => onSegmentModeChange("MANUAL_STRAIGHT"),
          active: segmentMode === "MANUAL_STRAIGHT",
        },
        {
          section: "Análisis",
          label: "Análisis y Route Doctor",
          icon: Activity,
          action: onShowAnalysis,
        },
        {
          section: "Análisis",
          label: "Comparar alternativas",
          icon: GitBranch,
          action: onShowAlternatives,
        },
        {
          section: "Mapa",
          label: inspectMode ? "Inspeccionar (ON)" : "Inspeccionar vía",
          icon: Search,
          action: onToggleInspect,
          active: inspectMode,
        },
        {
          section: "Mapa",
          label: "Panel ruta",
          icon: List,
          action: onOpenRoutePanel,
        },
        {
          section: "Mapa",
          label: "Mapas y capas",
          icon: Layers,
          action: onLayers,
        },
        {
          section: "Archivo",
          label: "Importar GPX",
          icon: Upload,
          action: onImport,
        },
        {
          section: "Archivo",
          label: "Exportar GPX",
          icon: Download,
          action: onExport,
          disabled: !canExport,
        },
        {
          section: "Archivo",
          label: "Guardar",
          icon: Cloud,
          action: onSave,
          disabled: !canSave,
        },
        {
          section: "Archivo",
          label: "Enviar a NavRide App",
          icon: Smartphone,
          action: onLaunch,
          disabled: !canLaunch,
        },
      ];
      if (showExit && onExit) {
        list.push({
          section: "Archivo",
          label: "Salir del editor",
          icon: DoorOpen,
          action: onExit,
        });
      }
      return list;
    },
    [
      canAddSegment,
      canExport,
      canInsert,
      canJoin,
      canLaunch,
      canReverse,
      canCloseLoop,
      canSave,
      canSplit,
      editorMode,
      onAddSegment,
      onCloseLoop,
      onEditorModeChange,
      onExit,
      onExport,
      onImport,
      onInsertMode,
      onJoinSegment,
      onLaunch,
      onLayers,
      onReverseRoute,
      onSave,
      onSegmentModeChange,
      onShowAlternatives,
      onShowAnalysis,
      onSplitSegment,
      onToggleInspect,
      onOpenRoutePanel,
      onTransportChange,
      segmentMode,
      inspectMode,
      showExit,
      transportMode,
    ],
  );

  const run = (action: () => void) => {
    setOpen(false);
    action();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: position,
      moved: false,
    };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    setPosition(
      clampPosition({
        x: drag.origin.x + dx,
        y: drag.origin.y + dy,
      }),
    );
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    suppressClickRef.current = drag.moved;
    dragRef.current = null;
    if (drag.moved) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    }
  };

  const onMainClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setOpen((value) => !value);
  };

  const menuHeight = Math.min(actions.length * 42 + 90, 420);
  const menuWidth = 220;
  const placeAbove =
    typeof window === "undefined"
      ? true
      : position.y > window.innerHeight / 2;
  const rawMenuTop = placeAbove
    ? position.y - menuHeight - 10
    : position.y + BUTTON_SIZE + 10;
  const menuTop =
    typeof window === "undefined"
      ? Math.max(EDGE, rawMenuTop)
      : Math.min(
          Math.max(EDGE, rawMenuTop),
          Math.max(EDGE, window.innerHeight - menuHeight - EDGE),
        );
  const menuLeft =
    typeof window === "undefined"
      ? position.x
      : Math.min(
          Math.max(EDGE, position.x + BUTTON_SIZE - menuWidth),
          window.innerWidth - menuWidth - EDGE,
        );

  return (
    <>
      {open && (
        <div
          className="fixed z-[190] max-h-[min(420px,calc(100dvh-28px))] w-[220px] overflow-y-auto rounded-2xl border border-white/15 bg-[#090a0c]/95 shadow-2xl backdrop-blur-xl"
          style={{ left: menuLeft, top: menuTop }}
          role="menu"
          aria-label="Herramientas del editor"
        >
          <div className="border-b border-white/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              Editor GPX
            </p>
          </div>
          <div className="p-1.5">
            {actions.map(({ section, label, icon: Icon, action, disabled, active }, index) => {
              const previous = index > 0 ? actions[index - 1].section : null;
              return (
                <div key={`${section}-${label}`}>
                  {section !== previous && (
                    <p className="px-2 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/30">
                      {section}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => run(action)}
                    disabled={disabled}
                    className={`flex min-h-9 w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent ${
                      active
                        ? "bg-[#f97316]/15 text-white"
                        : "text-white/80 hover:bg-white/8 hover:text-white disabled:hover:text-white/80"
                    }`}
                    role="menuitem"
                    aria-current={active ? "true" : undefined}
                  >
                    <Icon size={15} className="shrink-0 text-[#f97316]" />
                    <span className="flex-1">{label}</span>
                    {active && <Check size={14} className="shrink-0 text-[#f97316]" />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragRef.current = null;
          suppressClickRef.current = false;
        }}
        onClick={onMainClick}
        aria-label={
          open
            ? "Cerrar rueda de herramientas; arrastrar para mover"
            : "Abrir rueda de herramientas; arrastrar para mover"
        }
        title="Herramientas · arrastra para mover"
        className="fixed z-[200] flex h-16 w-16 touch-none select-none items-center justify-center rounded-full border border-white/20 bg-[#f97316] text-white shadow-[0_18px_45px_rgba(0,0,0,.45)] transition-transform active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ left: position.x, top: position.y }}
      >
        {open ? <X size={26} /> : <Plus size={30} strokeWidth={2.4} />}
      </button>
    </>
  );
}
