export type EditorMode = "simple" | "advanced";

/** Capacidades exclusivas de Avanzado (deben cambiar la UX real). */
export const ADVANCED_ONLY = [
  "waypoint_list",
  "waypoint_select",
  "waypoint_reorder",
  "waypoint_delete",
  "waypoint_insert",
  "track_width_opacity",
  "segment_name_edit",
  "transport_reroute_on_change",
  "route_health_details",
  "absurd_detour_handling",
  "via_shaping",
  "cues",
  "segment_split",
  "freehand_routed",
  "elevation_panel",
  "offline_pack_config",
  "import_gpx",
  "cuesheet",
] as const;

/** Capacidades disponibles en Básico (y también en Avanzado). */
export const BASIC_CAPABILITIES = [
  "activity_mode",
  "locate",
  "add_points",
  "undo_redo",
  "save",
  "export",
] as const;

export type AdvancedCapability = (typeof ADVANCED_ONLY)[number];
export type BasicCapability = (typeof BASIC_CAPABILITIES)[number];
export type StudioCapability = AdvancedCapability | BasicCapability;

export function isAdvancedMode(mode: EditorMode): boolean {
  return mode === "advanced";
}

export function hasCapability(
  mode: EditorMode,
  capability: StudioCapability,
): boolean {
  if ((BASIC_CAPABILITIES as readonly string[]).includes(capability)) {
    return true;
  }
  return isAdvancedMode(mode);
}

export function advancedCapabilitiesDiff(): string[] {
  return [...ADVANCED_ONLY];
}

export function modesAreDistinct(): boolean {
  return ADVANCED_ONLY.every(
    (c) => !(BASIC_CAPABILITIES as readonly string[]).includes(c),
  );
}
