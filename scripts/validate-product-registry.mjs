#!/usr/bin/env node
/**
 * CI gate: product registry schema + consistency with capabilities catalog.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(
  readFileSync(join(root, "lib/product/product_registry_v1.json"), "utf8"),
);
const capabilities = JSON.parse(
  readFileSync(join(root, "lib/capabilities/capabilities_v1.json"), "utf8"),
);

let errors = 0;

for (const f of registry.features ?? []) {
  if (!f.id || !f.name || !f.status || !Array.isArray(f.milestones)) {
    console.error("Invalid feature:", f.id ?? "(missing id)");
    errors++;
  }
  const ms = f.milestones ?? [];
  if (ms.length === 0) {
    console.error("Feature without milestones:", f.id);
    errors++;
  }
  const pass = ms.filter((m) => m.state === "PASS").length;
  const computed = Math.round(
    ((pass + ms.filter((m) => m.state === "IN_PROGRESS").length * 0.5) /
      ms.filter((m) => m.state !== "BLOCKED_EXTERNAL").length) *
      100,
  );
  if (Number.isNaN(computed)) {
    console.error("Bad milestone math:", f.id);
    errors++;
  }
}

const capIds = new Set((capabilities.capabilities ?? []).map((c) => c.capabilityId));
for (const f of registry.features ?? []) {
  if (f.capabilityId && !capIds.has(f.capabilityId)) {
    console.error("Missing capability for feature:", f.id, f.capabilityId);
    errors++;
  }
  if (f.status === "AVAILABLE" && f.capabilityId) {
    const cap = capabilities.capabilities.find((c) => c.capabilityId === f.capabilityId);
    if (cap && cap.stage === "disabled") {
      console.error("AVAILABLE feature but disabled capability:", f.id);
      errors++;
    }
  }
}

if (errors > 0) {
  console.error(`PRODUCT REGISTRY VALIDATION: FAIL (${errors} issues)`);
  process.exit(1);
}
console.log("PRODUCT REGISTRY VALIDATION: PASS");
console.log("PRODUCT CONSISTENCY CONTRADICTIONS:", 0);
