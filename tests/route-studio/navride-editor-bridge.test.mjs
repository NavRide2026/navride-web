import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  encodeBridgeMessage,
  isNavRideAppEmbed,
  parseBridgeMessage,
  NAVRIDE_EDITOR_BRIDGE_SCHEMA,
} from "../../lib/route-studio/navride-editor-bridge.ts";

describe("NavRideEditorBridge v1", () => {
  it("recognizes navride-app embed", () => {
    assert.equal(isNavRideAppEmbed("navride-app"), true);
    assert.equal(isNavRideAppEmbed(null), false);
    assert.equal(isNavRideAppEmbed("other"), false);
  });

  it("encodes READY / SAVE_ROUTE / OPEN_IN_NAVRIDE / dirty", () => {
    for (const type of [
      "READY",
      "SAVE_ROUTE",
      "EXPORT_GPX",
      "OPEN_IN_NAVRIDE",
      "DIRTY_STATE_CHANGED",
    ]) {
      const raw = encodeBridgeMessage(
        /** @type {any} */ (type),
        type === "DIRTY_STATE_CHANGED" ? { dirty: true } : { ok: true },
        "req-test-1",
      );
      const parsed = parseBridgeMessage(raw);
      assert.equal(parsed.ok, true);
      if (parsed.ok) {
        assert.equal(parsed.message.schemaVersion, NAVRIDE_EDITOR_BRIDGE_SCHEMA);
        assert.equal(parsed.message.type, type);
        assert.equal(parsed.message.requestId, "req-test-1");
      }
    }
  });

  it("encodes location bridge messages", () => {
    const req = encodeBridgeMessage("REQUEST_CURRENT_LOCATION", undefined, "req-loc");
    assert.equal(parseBridgeMessage(req).ok, true);
    const ok = encodeBridgeMessage(
      "CURRENT_LOCATION",
      { latitude: 1, longitude: 2, accuracyMeters: 5, timestampMs: 9 },
      "req-loc",
    );
    const parsedOk = parseBridgeMessage(ok);
    assert.equal(parsedOk.ok, true);
    if (parsedOk.ok) assert.equal(parsedOk.message.type, "CURRENT_LOCATION");
    const err = encodeBridgeMessage(
      "CURRENT_LOCATION_ERROR",
      { reason: "PERMISSION_DENIED" },
      "req-loc",
    );
    assert.equal(parseBridgeMessage(err).ok, true);
  });

  it("rejects unknown type and bad schema", () => {
    assert.equal(
      parseBridgeMessage(
        JSON.stringify({ schemaVersion: 1, type: "HACK", requestId: "abcd" }),
      ).ok,
      false,
    );
    assert.equal(
      parseBridgeMessage(
        JSON.stringify({ schemaVersion: 99, type: "READY", requestId: "abcd" }),
      ).ok,
      false,
    );
  });

  it("normal mode embed flag unchanged contract", () => {
    assert.equal(isNavRideAppEmbed(""), false);
    assert.equal(isNavRideAppEmbed(undefined), false);
  });
});
