"use client";

import { useEffect } from "react";
import {
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/lib/route-studio/autosave";
import type { EditorMode } from "@/lib/route-studio/mode-capabilities";
import type { TransportMode } from "@/lib/route-studio/routing";
import type { Segment } from "./editor-types";

export function useEditorDraftAutosave({
  segments,
  routeTitle,
  transportMode,
  editorMode,
}: {
  segments: Segment[];
  routeTitle: string;
  transportMode: TransportMode;
  editorMode: EditorMode;
}): void {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveDraft({
        savedAt: new Date().toISOString(),
        routeTitle,
        transportMode,
        editorMode,
        segments,
        trackColor: segments[0]?.color,
      });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [segments, routeTitle, transportMode, editorMode]);
}

export interface RestoredEditorDraft {
  segments: Segment[];
  routeTitle: string;
  transportMode: TransportMode;
  editorMode: EditorMode;
}

export function restoreEditorDraft(): RestoredEditorDraft | null {
  const draft = loadDraft();
  if (!draft?.segments || !Array.isArray(draft.segments)) return null;
  return {
    segments: draft.segments as Segment[],
    routeTitle: draft.routeTitle,
    transportMode: (draft.transportMode as TransportMode) || "moto",
    editorMode:
      draft.editorMode === "advanced" ? "advanced" : "simple",
  };
}

export function dismissEditorDraft(): void {
  clearDraft();
}
