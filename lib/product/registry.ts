/**
 * NavRide Product Registry — SSOT de producto para web (y referencia app).
 * Progreso derivado de milestones verificables; nunca manual a ojo.
 */
import registryJson from "./product_registry_v1.json";

export type ProductStatus =
  | "AVAILABLE"
  | "BETA"
  | "IN_DEVELOPMENT"
  | "PLANNED"
  | "PAUSED"
  | "NOT_PUBLIC";

export type MilestoneState =
  | "PASS"
  | "IN_PROGRESS"
  | "NOT_STARTED"
  | "BLOCKED_EXTERNAL";

export type ProductFeature = {
  id: string;
  name: string;
  publicDescription: string;
  platforms: ("app" | "web" | "android_auto")[];
  status: ProductStatus;
  releaseChannel: string;
  currentVersion?: string;
  capabilityId?: string;
  milestones: {
    id: string;
    label: string;
    state: MilestoneState;
    evidence: string;
  }[];
  lastUpdated: string;
};

export const REGISTRY_VERSION: string =
  (registryJson as { registryVersion?: string }).registryVersion ?? "1.0.0";

export const PRODUCT_FEATURES: ProductFeature[] = (
  (registryJson as { features: ProductFeature[] }).features ?? []
).map((f) => ({
  ...f,
  platforms: f.platforms.map((p) =>
    p === "android_auto" ? "android_auto" : p,
  ) as ProductFeature["platforms"],
}));

/** Progreso 0–100 derivado de milestones PASS / total ponderables. */
export function milestoneProgress(feature: ProductFeature): number {
  const ms = feature.milestones.filter((m) => m.state !== "BLOCKED_EXTERNAL");
  if (ms.length === 0) return 0;
  const pass = ms.filter((m) => m.state === "PASS").length;
  const partial = ms.filter((m) => m.state === "IN_PROGRESS").length;
  const score = pass + partial * 0.5;
  return Math.round((score / ms.length) * 100);
}

export function featuresByStatus(status: ProductStatus): ProductFeature[] {
  return PRODUCT_FEATURES.filter((f) => f.status === status);
}

export function featuresForPlatform(
  platform: "app" | "web",
): ProductFeature[] {
  return PRODUCT_FEATURES.filter((f) => f.platforms.includes(platform));
}

export function statusLabel(status: ProductStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "Disponible ahora";
    case "BETA":
      return "En beta";
    case "IN_DEVELOPMENT":
      return "En desarrollo";
    case "PLANNED":
      return "Exploración";
    case "PAUSED":
      return "Pausado";
    default:
      return "No público";
  }
}

export function roadmapGroups() {
  return {
    available: PRODUCT_FEATURES.filter((f) => f.status === "AVAILABLE"),
    beta: PRODUCT_FEATURES.filter((f) => f.status === "BETA"),
    inDevelopment: PRODUCT_FEATURES.filter((f) => f.status === "IN_DEVELOPMENT"),
    planned: PRODUCT_FEATURES.filter((f) => f.status === "PLANNED"),
    paused: PRODUCT_FEATURES.filter((f) => f.status === "PAUSED"),
  };
}
