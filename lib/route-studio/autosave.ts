const DRAFT_KEY = "navride_route_studio_draft_v1";

export type RouteDraft = {
  savedAt: string;
  routeTitle: string;
  transportMode: string;
  editorMode: "simple" | "advanced";
  segments: unknown;
  trackColor?: string;
};

export function saveDraft(draft: RouteDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
  } catch {
    /* quota */
  }
}

export function loadDraft(): RouteDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as RouteDraft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}
