/**
 * NavRideEditorBridge v1 — App ↔ Route Studio (WebView embed).
 * Closed message set only. No arbitrary executeAnything.
 */

export const NAVRIDE_EDITOR_BRIDGE_SCHEMA = 1 as const;
export const NAVRIDE_APP_EMBED = "navride-app" as const;

export type NavRideEditorBridgeType =
  | "READY"
  | "SAVE_ROUTE"
  | "EXPORT_GPX"
  | "OPEN_IN_NAVRIDE"
  | "DIRTY_STATE_CHANGED"
  | "CLOSE_REQUEST"
  | "ERROR"
  | "CONFIG"
  | "SAVE_RESULT"
  | "EXPORT_ACK"
  | "LOAD_ROUTE"
  | "REQUEST_CURRENT_LOCATION"
  | "CURRENT_LOCATION"
  | "CURRENT_LOCATION_ERROR";

export type NavRideCurrentLocationErrorReason =
  | "PERMISSION_DENIED"
  | "LOCATION_UNAVAILABLE"
  | "TIMEOUT";

export type NavRideEditorBridgeMessage = {
  schemaVersion: typeof NAVRIDE_EDITOR_BRIDGE_SCHEMA;
  type: NavRideEditorBridgeType;
  requestId: string;
  payload?: Record<string, unknown>;
};

const ALLOWED = new Set<string>([
  "READY",
  "SAVE_ROUTE",
  "EXPORT_GPX",
  "OPEN_IN_NAVRIDE",
  "DIRTY_STATE_CHANGED",
  "CLOSE_REQUEST",
  "ERROR",
  "CONFIG",
  "SAVE_RESULT",
  "EXPORT_ACK",
  "LOAD_ROUTE",
  "REQUEST_CURRENT_LOCATION",
  "CURRENT_LOCATION",
  "CURRENT_LOCATION_ERROR",
]);

export function isNavRideAppEmbed(embed: string | null | undefined): boolean {
  return embed === NAVRIDE_APP_EMBED;
}

export function newBridgeRequestId(): string {
  return `nr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Max JSON size accepted on either side (~4 MiB). */
export const BRIDGE_MAX_BYTES = 4 * 1024 * 1024;

export function parseBridgeMessage(
  raw: unknown,
): { ok: true; message: NavRideEditorBridgeMessage } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "NOT_STRING" };
  }
  if (raw.length > BRIDGE_MAX_BYTES) {
    return { ok: false, error: "TOO_LARGE" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "INVALID_JSON" };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "NOT_OBJECT" };
  }
  const o = parsed as Record<string, unknown>;
  const schemaVersion = o.schemaVersion;
  if (schemaVersion !== 1) {
    return { ok: false, error: "BAD_SCHEMA" };
  }
  const type = o.type;
  if (typeof type !== "string" || !ALLOWED.has(type)) {
    return { ok: false, error: "UNKNOWN_TYPE" };
  }
  const requestId = o.requestId;
  if (typeof requestId !== "string" || requestId.length < 4 || requestId.length > 128) {
    return { ok: false, error: "BAD_REQUEST_ID" };
  }
  const payload = o.payload;
  if (payload !== undefined && (typeof payload !== "object" || payload === null || Array.isArray(payload))) {
    return { ok: false, error: "BAD_PAYLOAD" };
  }
  return {
    ok: true,
    message: {
      schemaVersion: 1,
      type: type as NavRideEditorBridgeType,
      requestId,
      payload: payload as Record<string, unknown> | undefined,
    },
  };
}

export function encodeBridgeMessage(
  type: NavRideEditorBridgeType,
  payload?: Record<string, unknown>,
  requestId: string = newBridgeRequestId(),
): string {
  const msg: NavRideEditorBridgeMessage = {
    schemaVersion: NAVRIDE_EDITOR_BRIDGE_SCHEMA,
    type,
    requestId,
    ...(payload ? { payload } : {}),
  };
  return JSON.stringify(msg);
}

declare global {
  interface Window {
    /** Flutter Android/iOS JavaScriptChannel */
    NavRideEditorBridge?: { postMessage: (msg: string) => void };
    /** App → Web receive hook */
    __navrideAppToEditor?: (raw: string) => void;
    __navrideEmbedReady?: boolean;
  }
}

/** Web → App (only when channel injected by Flutter). */
export function postToNavRideApp(
  type: NavRideEditorBridgeType,
  payload?: Record<string, unknown>,
  requestId?: string,
): string {
  const encoded = encodeBridgeMessage(type, payload, requestId ?? newBridgeRequestId());
  try {
    window.NavRideEditorBridge?.postMessage(encoded);
  } catch {
    // Channel absent in normal browser mode.
  }
  return encoded;
}

export function registerAppToEditorHandler(
  handler: (msg: NavRideEditorBridgeMessage) => void,
): () => void {
  const prev = window.__navrideAppToEditor;
  window.__navrideAppToEditor = (raw: string) => {
    const parsed = parseBridgeMessage(raw);
    if (!parsed.ok) return;
    handler(parsed.message);
  };
  return () => {
    window.__navrideAppToEditor = prev;
  };
}
