import {
  type NavRideCue,
  type NavRideCueActivation,
  type NavRideCueSeverity,
  CUE_SEVERITIES,
} from "./navride-route/types.ts";

export const CUE_SEVERITY_LABELS_ES: Record<NavRideCueSeverity, string> = {
  info: "Info",
  attention: "Atención",
  caution: "Precaución",
  danger: "Peligro",
};

export function cueSeverityLabel(severity: NavRideCueSeverity): string {
  return CUE_SEVERITY_LABELS_ES[severity] ?? severity;
}

export function isCueSeverity(v: unknown): v is NavRideCueSeverity {
  return (
    typeof v === "string" &&
    (CUE_SEVERITIES as readonly string[]).includes(v)
  );
}

function uid(prefix = "cue"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export type CreateCueInput = {
  message: string;
  severity?: NavRideCueSeverity;
  progressM?: number | null;
  lat?: number | null;
  lon?: number | null;
  noteStatus?: "on_track" | "off_track";
  nearestSegmentIndex?: number | null;
  projectionFraction?: number | null;
  title?: string;
  category?: string;
  segmentId?: string | null;
  cueId?: string;
  startProgressM?: number | null;
  endProgressM?: number | null;
  voiceEnabled?: boolean;
  beepEnabled?: boolean;
  directionality?: "forward" | "backward" | "both";
  activationPolicy?: NavRideCueActivation;
  creator?: string | null;
};

export function createCue(input: CreateCueInput): NavRideCue {
  const severity = input.severity ?? "info";
  const message = (input.message || "").trim() || "Aviso";
  const title =
    (input.title || "").trim() ||
    cueSeverityLabel(severity);

  return {
    cueId: input.cueId ?? uid(),
    title,
    message,
    severity,
    progressM: input.progressM ?? null,
    lat: input.lat ?? null,
    lon: input.lon ?? null,
    noteStatus: input.noteStatus ?? (input.progressM == null ? "off_track" : "on_track"),
    nearestSegmentIndex: input.nearestSegmentIndex ?? null,
    projectionFraction: input.projectionFraction ?? null,
    category: input.category ?? "note",
    segmentId: input.segmentId ?? null,
    startProgressM: input.startProgressM ?? null,
    endProgressM: input.endProgressM ?? null,
    voiceEnabled: input.voiceEnabled !== false,
    beepEnabled: input.beepEnabled !== false,
    directionality: input.directionality ?? "forward",
    activationPolicy: input.activationPolicy ?? "once",
    creator: input.creator ?? "web-studio",
  };
}

export function createCueAtProgress(
  progressM: number,
  message: string,
  severity: NavRideCueSeverity = "attention",
  extras?: Omit<CreateCueInput, "progressM" | "message" | "severity">,
): NavRideCue {
  return createCue({
    ...extras,
    progressM,
    message,
    severity,
  });
}
