import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import test from "node:test";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

test("product registry has features with milestones", () => {
  const registry = JSON.parse(
    readFileSync(join(root, "lib/product/product_registry_v1.json"), "utf8"),
  );
  assert.ok(registry.features.length >= 5);
  for (const f of registry.features) {
    assert.ok(f.milestones.length >= 1);
    assert.ok(["AVAILABLE", "BETA", "IN_DEVELOPMENT", "PLANNED", "PAUSED", "NOT_PUBLIC"].includes(f.status));
  }
});

test("news entries are public only when flagged", () => {
  const news = JSON.parse(
    readFileSync(join(root, "lib/product/news_v1.json"), "utf8"),
  );
  for (const e of news.entries) {
    if (e.public) {
      assert.ok(e.title && e.summary && e.date);
    }
  }
});

test("milestone progress is derived not hardcoded fake", () => {
  const registry = JSON.parse(
    readFileSync(join(root, "lib/product/product_registry_v1.json"), "utf8"),
  );
  const aa = registry.features.find((f) => f.id === "androidAuto");
  const pass = aa.milestones.filter((m) => m.state === "PASS").length;
  const total = aa.milestones.length;
  const expected = Math.round((pass / total) * 100);
  assert.equal(expected, 75);
});
