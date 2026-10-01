"use client";

import {
  useMemo,
  useReducer,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { TransportMode } from "@/lib/route-studio/routing";
import type { RouteSegmentMode } from "@/lib/route-studio/segment-routing-mode";
import type { EditorMode } from "@/lib/route-studio/mode-capabilities";
import {
  DEFAULT_TRACK_OPACITY,
  DEFAULT_TRACK_WIDTH,
} from "@/lib/route-studio/track-style";
import { loadDraft } from "@/lib/route-studio/autosave";
import type {
  ImportDialogState,
  LngLat,
  NavRideCue,
  NavRideCueSeverity,
  Segment,
  StyleId,
} from "./editor-types";

export interface GpxEditorState {
  segments: Segment[];
  activeId: string;
  mapStyleId: StyleId;
  routeTitle: string;
  routing: boolean;
  histIdx: number;
  histLen: number;
  uploading: boolean;
  saving: boolean;
  uploadMsg: { ok: boolean; text: string } | null;
  savedRouteId: string | null;
  savedSignature: string;
  transportMode: TransportMode;
  editorMode: EditorMode;
  routeError: string | null;
  locating: boolean;
  draftBanner: string | null;
  sidebarCollapsed: boolean;
  activeWpt: { segId: string; idx: number } | null;
  trackWidth: number;
  trackOpacity: number;
  userLngLat: LngLat | null;
  insertMode: boolean;
  cues: NavRideCue[];
  selectedCueId: string | null;
  cueDraftSeverity: NavRideCueSeverity;
  cueDraftMessage: string;
  placeNotePending: boolean;
  drawMode: RouteSegmentMode;
  importDialog: ImportDialogState | null;
  drawerOpen: boolean;
  styleMenuOpen: boolean;
  colorPopoverSegId: string | null;
}

type EditorField = keyof GpxEditorState;
type EditorAction =
  | {
      type: "set";
      field: EditorField;
      value: unknown | ((previous: unknown) => unknown);
    }
  | { type: "replace"; state: GpxEditorState };

function reducer(state: GpxEditorState, action: EditorAction): GpxEditorState {
  if (action.type === "replace") return action.state;
  const previous = state[action.field];
  const next =
    typeof action.value === "function"
      ? (action.value as (value: unknown) => unknown)(previous)
      : action.value;
  if (Object.is(previous, next)) return state;
  return { ...state, [action.field]: next } as GpxEditorState;
}

function draftBanner(): string | null {
  if (typeof window === "undefined") return null;
  const draft = loadDraft();
  if (!draft?.segments || !Array.isArray(draft.segments)) return null;
  return `Borrador del ${new Date(draft.savedAt).toLocaleString("es-ES")}`;
}

function initialState(initialSegment: Segment): GpxEditorState {
  return {
    segments: [initialSegment],
    activeId: initialSegment.id,
    mapStyleId: "liberty",
    routeTitle: "Mi ruta NavRide",
    routing: false,
    histIdx: 0,
    histLen: 1,
    uploading: false,
    saving: false,
    uploadMsg: null,
    savedRouteId: null,
    savedSignature: "",
    transportMode: "moto",
    editorMode: "simple",
    routeError: null,
    locating: false,
    draftBanner: draftBanner(),
    sidebarCollapsed: false,
    activeWpt: null,
    trackWidth: DEFAULT_TRACK_WIDTH,
    trackOpacity: DEFAULT_TRACK_OPACITY,
    userLngLat: null,
    insertMode: false,
    cues: [],
    selectedCueId: null,
    cueDraftSeverity: "attention",
    cueDraftMessage: "",
    placeNotePending: false,
    drawMode: "FOLLOW_ROAD",
    importDialog: null,
    drawerOpen: false,
    styleMenuOpen: false,
    colorPopoverSegId: null,
  };
}

type Setter<K extends EditorField> = Dispatch<SetStateAction<GpxEditorState[K]>>;

export interface GpxEditorActions {
  setSegments: Setter<"segments">;
  setActiveId: Setter<"activeId">;
  setMapStyleId: Setter<"mapStyleId">;
  setRouteTitle: Setter<"routeTitle">;
  setRouting: Setter<"routing">;
  setHistIdx: Setter<"histIdx">;
  setHistLen: Setter<"histLen">;
  setUploading: Setter<"uploading">;
  setSaving: Setter<"saving">;
  setUploadMsg: Setter<"uploadMsg">;
  setSavedRouteId: Setter<"savedRouteId">;
  setSavedSignature: Setter<"savedSignature">;
  setTransportMode: Setter<"transportMode">;
  setEditorMode: Setter<"editorMode">;
  setRouteError: Setter<"routeError">;
  setLocating: Setter<"locating">;
  setDraftBanner: Setter<"draftBanner">;
  setSidebarCollapsed: Setter<"sidebarCollapsed">;
  setActiveWpt: Setter<"activeWpt">;
  setTrackWidth: Setter<"trackWidth">;
  setTrackOpacity: Setter<"trackOpacity">;
  setUserLngLat: Setter<"userLngLat">;
  setInsertMode: Setter<"insertMode">;
  setCues: Setter<"cues">;
  setSelectedCueId: Setter<"selectedCueId">;
  setCueDraftSeverity: Setter<"cueDraftSeverity">;
  setCueDraftMessage: Setter<"cueDraftMessage">;
  setPlaceNotePending: Setter<"placeNotePending">;
  setDrawMode: Setter<"drawMode">;
  setImportDialog: Setter<"importDialog">;
  setDrawerOpen: Setter<"drawerOpen">;
  setStyleMenuOpen: Setter<"styleMenuOpen">;
  setColorPopoverSegId: Setter<"colorPopoverSegId">;
}

export function useGpxEditorStore(initialSegment: Segment): [
  GpxEditorState,
  GpxEditorActions,
] {
  const [state, dispatch] = useReducer(
    reducer,
    initialSegment,
    initialState,
  );

  const actions = useMemo(() => {
    const setter = <K extends EditorField>(field: K): Setter<K> =>
      ((value: SetStateAction<GpxEditorState[K]>) =>
        dispatch({ type: "set", field, value })) as Setter<K>;
    return {
      setSegments: setter("segments"),
      setActiveId: setter("activeId"),
      setMapStyleId: setter("mapStyleId"),
      setRouteTitle: setter("routeTitle"),
      setRouting: setter("routing"),
      setHistIdx: setter("histIdx"),
      setHistLen: setter("histLen"),
      setUploading: setter("uploading"),
      setSaving: setter("saving"),
      setUploadMsg: setter("uploadMsg"),
      setSavedRouteId: setter("savedRouteId"),
      setSavedSignature: setter("savedSignature"),
      setTransportMode: setter("transportMode"),
      setEditorMode: setter("editorMode"),
      setRouteError: setter("routeError"),
      setLocating: setter("locating"),
      setDraftBanner: setter("draftBanner"),
      setSidebarCollapsed: setter("sidebarCollapsed"),
      setActiveWpt: setter("activeWpt"),
      setTrackWidth: setter("trackWidth"),
      setTrackOpacity: setter("trackOpacity"),
      setUserLngLat: setter("userLngLat"),
      setInsertMode: setter("insertMode"),
      setCues: setter("cues"),
      setSelectedCueId: setter("selectedCueId"),
      setCueDraftSeverity: setter("cueDraftSeverity"),
      setCueDraftMessage: setter("cueDraftMessage"),
      setPlaceNotePending: setter("placeNotePending"),
      setDrawMode: setter("drawMode"),
      setImportDialog: setter("importDialog"),
      setDrawerOpen: setter("drawerOpen"),
      setStyleMenuOpen: setter("styleMenuOpen"),
      setColorPopoverSegId: setter("colorPopoverSegId"),
    } satisfies GpxEditorActions;
  }, []);

  return [state, actions];
}
