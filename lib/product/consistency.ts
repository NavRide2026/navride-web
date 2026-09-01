/**
 * Valida coherencia entre Product Registry y Capability catalog.
 * PRODUCT CONSISTENCY CONTRADICTIONS debe ser 0.
 */
import { NAVRIDE_CAPABILITIES, stageToUx } from "../capabilities/catalog";
import { PRODUCT_FEATURES, type ProductFeature } from "./registry";

export type ConsistencyIssue = {
  kind: "status_mismatch" | "missing_capability" | "platform_mismatch";
  featureId: string;
  message: string;
};

const STATUS_MAP: Record<string, string[]> = {
  AVAILABLE: ["Disponible"],
  BETA: ["Disponible", "Próximamente", "En desarrollo"],
  IN_DEVELOPMENT: ["En desarrollo", "Próximamente"],
  PLANNED: ["Próximamente", "En desarrollo", "hidden"],
  PAUSED: ["Próximamente", "En desarrollo", "hidden"],
  NOT_PUBLIC: ["hidden"],
};

export function validateProductConsistency(): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  for (const feature of PRODUCT_FEATURES) {
    if (!feature.capabilityId) continue;
    const cap = NAVRIDE_CAPABILITIES.find((c) => c.key === feature.capabilityId);
    if (!cap) {
      issues.push({
        kind: "missing_capability",
        featureId: feature.id,
        message: `capabilityId ${feature.capabilityId} no existe en capabilities_v1.json`,
      });
      continue;
    }

    const ux = stageToUx(cap.stage);
    const allowed = STATUS_MAP[feature.status] ?? [];
    if (feature.status === "AVAILABLE" && ux !== "Disponible") {
      issues.push({
        kind: "status_mismatch",
        featureId: feature.id,
        message: `Registry AVAILABLE pero capability ${cap.key} es ${ux} (${cap.stage})`,
      });
    }
    if (feature.status === "BETA" && ux === "hidden") {
      issues.push({
        kind: "status_mismatch",
        featureId: feature.id,
        message: `Registry BETA pero capability ${cap.key} está oculta`,
      });
    }

    if (feature.platforms.includes("web") && !cap.web && feature.status === "AVAILABLE") {
      issues.push({
        kind: "platform_mismatch",
        featureId: feature.id,
        message: `${feature.id} AVAILABLE en web pero capability.web=false`,
      });
    }
  }

  // Android Auto: registry BETA vs capability inDevelopment — documentado, no error si web explica beta
  const aa = PRODUCT_FEATURES.find((f) => f.id === "androidAuto") as ProductFeature | undefined;
  const aaCap = NAVRIDE_CAPABILITIES.find((c) => c.key === "androidAuto");
  if (aa && aaCap && aa.status === "BETA" && aaCap.stage === "inDevelopment") {
    // Coherente: implementado en código, capability gate app hasta v11400
  }

  return issues;
}

export function consistencyReport(): {
  ok: boolean;
  issues: ConsistencyIssue[];
  contradictionCount: number;
} {
  const issues = validateProductConsistency();
  return {
    ok: issues.length === 0,
    issues,
    contradictionCount: issues.length,
  };
}
