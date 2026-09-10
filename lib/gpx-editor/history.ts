import { cloneDoc, type GpxDocument } from "./types.ts";

export const HISTORY_CAP = 80;

export type HistoryState = {
  entries: GpxDocument[];
  index: number;
};

export function createHistory(initial: GpxDocument): HistoryState {
  return { entries: [cloneDoc(initial)], index: 0 };
}

export function pushHistory(state: HistoryState, doc: GpxDocument): HistoryState {
  const trimmed = state.entries.slice(0, state.index + 1);
  trimmed.push(cloneDoc(doc));
  if (trimmed.length > HISTORY_CAP) {
    trimmed.splice(0, trimmed.length - HISTORY_CAP);
  }
  return { entries: trimmed, index: trimmed.length - 1 };
}

export function canUndo(state: HistoryState): boolean {
  return state.index > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.index < state.entries.length - 1;
}

export function undo(state: HistoryState): { state: HistoryState; doc: GpxDocument } | null {
  if (!canUndo(state)) return null;
  const index = state.index - 1;
  return { state: { ...state, index }, doc: cloneDoc(state.entries[index]) };
}

export function redo(state: HistoryState): { state: HistoryState; doc: GpxDocument } | null {
  if (!canRedo(state)) return null;
  const index = state.index + 1;
  return { state: { ...state, index }, doc: cloneDoc(state.entries[index]) };
}
