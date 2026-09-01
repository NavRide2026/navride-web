/**
 * Catálogo de capabilities — SSOT: capabilities_v1.json
 * (misma copia que app/assets/contracts y contracts/ en el monorepo NavRide).
 * No mantener una segunda lista divergente a mano.
 */
import catalogJson from "./capabilities_v1.json";

export type CapabilityStage =
  | "disabled"
  | "internal"
  | "inDevelopment"
  | "readyLocked"
  | "betaTesters"
  | "rollout"
  | "public";

export type CapabilityUx =
  | "Disponible"
  | "Nuevo"
  | "Próximamente"
  | "En desarrollo"
  | "hidden";

export type NavRideCapability = {
  key: string;
  title: string;
  shortDescription: string;
  detailDescription: string;
  stage: CapabilityStage;
  releaseOrder: number;
  interestEnabled: boolean;
  minAppVersion?: number;
  app: boolean;
  web: boolean;
};

export const CATALOG_VERSION: string =
  (catalogJson as { catalogVersion?: string }).catalogVersion ?? "1.0.0";
export const SCHEMA_VERSION: number =
  (catalogJson as { schemaVersion?: number }).schemaVersion ?? 1;

type RawCap = {
  capabilityId: string;
  title: string;
  shortDescription: string;
  detailDescription: string;
  stage: CapabilityStage;
  minAppVersion?: number;
  releaseOrder: number;
  interestEnabled?: boolean;
  app?: boolean;
  web?: boolean;
};

export const NAVRIDE_CAPABILITIES: NavRideCapability[] = (
  (catalogJson as { capabilities: RawCap[] }).capabilities ?? []
).map((c) => ({
  key: c.capabilityId,
  title: c.title,
  shortDescription: c.shortDescription,
  detailDescription: c.detailDescription,
  stage: c.stage,
  releaseOrder: c.releaseOrder,
  interestEnabled: c.interestEnabled !== false,
  minAppVersion: c.minAppVersion,
  app: c.app !== false,
  web: c.web !== false,
}));

export function stageToUx(stage: CapabilityStage): CapabilityUx {
  switch (stage) {
    case "public":
    case "rollout":
    case "betaTesters":
      return "Disponible";
    case "readyLocked":
      return "Próximamente";
    case "inDevelopment":
      return "En desarrollo";
    default:
      return "hidden";
  }
}

export function upcomingForWeb(max = 6): NavRideCapability[] {
  return NAVRIDE_CAPABILITIES.filter((c) => {
    if (!c.web) return false;
    const ux = stageToUx(c.stage);
    return ux === "Próximamente" || ux === "En desarrollo";
  })
    .sort((a, b) => a.releaseOrder - b.releaseOrder)
    .slice(0, max);
}
