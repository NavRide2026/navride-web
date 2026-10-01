import type { RouteCapsule } from "@/lib/route-studio/navride-route/gpx-codec";
import type {
  NavRideCue,
  NavRideCueSeverity,
  NavRidePointKind,
  NavRideRoute,
} from "@/lib/route-studio/navride-route/types";
import type { RouteSegmentMode } from "@/lib/route-studio/segment-routing-mode";

export type LngLat = [number, number];
export type WaypointKind = Extract<NavRidePointKind, "via" | "shaping">;

export interface Segment {
  id: string;
  name: string;
  color: string;
  waypoints: LngLat[];
  waypointKinds?: WaypointKind[];
  routePoints: LngLat[];
  routingFailed?: boolean;
  absurdDetour?: boolean;
  pathKind?: "routed" | "freehand" | "track";
  routeSegmentMode?: RouteSegmentMode;
}

export type ImportDialogState = {
  issues: string[];
  geometry: { lat: number; lon: number; ele?: number | null }[];
  extensions: NavRideRoute | null;
  capsule: RouteCapsule | null;
  fileName: string;
};

export type StyleId = "liberty" | "satellite" | "bright" | "positron";

export interface EditorSelectionState {
  activeId: string;
  activeWpt: { segId: string; idx: number } | null;
  selectedCueId: string | null;
}

export interface EditorUiState {
  sidebarCollapsed: boolean;
  insertMode: boolean;
  placeNotePending: boolean;
  drawerOpen: boolean;
  styleMenuOpen: boolean;
  colorPopoverSegId: string | null;
  importDialog: ImportDialogState | null;
}

export type { NavRideCue, NavRideCueSeverity, RouteCapsule };
