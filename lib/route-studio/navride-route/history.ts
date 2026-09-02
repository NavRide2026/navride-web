import { HISTORY_CAP } from "../track-style.ts";

export type HistoryCommandType =
  | "SNAPSHOT"
  | "ADD_POINT"
  | "MOVE_POINT"
  | "DELETE_POINT"
  | "CHANGE_COLOR"
  | "ADD_CUE"
  | "DELETE_CUE"
  | "TOGGLE_VIA_SHAPING"
  | "RENAME_SEGMENT"
  | "CUSTOM";

export type HistoryCommand<TSnapshot = unknown, TPayload = unknown> = {
  type: HistoryCommandType;
  /** Full snapshot after the command (preferred for undo). */
  snapshot: TSnapshot;
  /** Optional before-snapshot for redo stacks that store deltas. */
  before?: TSnapshot;
  payload?: TPayload;
  label?: string;
  at?: string;
};

export type HistoryState<TSnapshot = unknown> = {
  entries: HistoryCommand<TSnapshot>[];
  index: number;
};

export function createHistory<TSnapshot>(
  initial: TSnapshot,
): HistoryState<TSnapshot> {
  return {
    entries: [
      {
        type: "SNAPSHOT",
        snapshot: clone(initial),
        label: "init",
        at: new Date().toISOString(),
      },
    ],
    index: 0,
  };
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function pushCommand<TSnapshot, TPayload = unknown>(
  state: HistoryState<TSnapshot>,
  command: Omit<HistoryCommand<TSnapshot, TPayload>, "at"> & { at?: string },
  cap: number = HISTORY_CAP,
): HistoryState<TSnapshot> {
  const trimmed = state.entries.slice(0, state.index + 1);
  const entry: HistoryCommand<TSnapshot, TPayload> = {
    ...command,
    snapshot: clone(command.snapshot),
    before: command.before !== undefined ? clone(command.before) : undefined,
    at: command.at ?? new Date().toISOString(),
  };
  let entries = [...trimmed, entry as HistoryCommand<TSnapshot>];
  if (entries.length > cap) {
    entries = entries.slice(entries.length - cap);
  }
  return { entries, index: entries.length - 1 };
}

export function pushSnapshot<TSnapshot>(
  state: HistoryState<TSnapshot>,
  snapshot: TSnapshot,
  type: HistoryCommandType = "SNAPSHOT",
  label?: string,
  cap: number = HISTORY_CAP,
): HistoryState<TSnapshot> {
  return pushCommand(state, { type, snapshot, label }, cap);
}

export function canUndo(state: HistoryState): boolean {
  return state.index > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.index < state.entries.length - 1;
}

export function undo<TSnapshot>(
  state: HistoryState<TSnapshot>,
): { state: HistoryState<TSnapshot>; snapshot: TSnapshot | null } {
  if (!canUndo(state)) {
    return {
      state,
      snapshot: state.entries[state.index]?.snapshot ?? null,
    };
  }
  const index = state.index - 1;
  return {
    state: { ...state, index },
    snapshot: clone(state.entries[index].snapshot),
  };
}

export function redo<TSnapshot>(
  state: HistoryState<TSnapshot>,
): { state: HistoryState<TSnapshot>; snapshot: TSnapshot | null } {
  if (!canRedo(state)) {
    return {
      state,
      snapshot: state.entries[state.index]?.snapshot ?? null,
    };
  }
  const index = state.index + 1;
  return {
    state: { ...state, index },
    snapshot: clone(state.entries[index].snapshot),
  };
}

export function currentSnapshot<TSnapshot>(
  state: HistoryState<TSnapshot>,
): TSnapshot | null {
  const e = state.entries[state.index];
  return e ? clone(e.snapshot) : null;
}

export { HISTORY_CAP };
