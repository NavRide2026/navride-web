import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DESIGN_CATEGORIES } from "../../lib/design/catalog.ts";

describe("discover catalog queries", () => {
  it("category queries are short (Iconify AND-safe)", () => {
    for (const c of DESIGN_CATEGORIES) {
      const words = c.query.trim().split(/\s+/);
      assert.ok(
        words.length <= 2,
        `${c.id} query too long for Iconify AND: "${c.query}"`,
      );
    }
  });

  it("has discover taxonomy: packs + components", () => {
    const ids = DESIGN_CATEGORIES.map((c) => c.id);
    assert.ok(ids.includes("packs"));
    assert.ok(ids.includes("compasses"));
    assert.ok(ids.includes("speedometers"));
  });
});
