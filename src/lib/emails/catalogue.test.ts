import { describe, expect, it } from "vitest";

import {
  EMAIL_KIND_OPTIONS,
  EMAIL_KINDS,
  emailKeyForOrderStage,
  emailKindByKey,
} from "./catalogue";

/**
 * These tests exist because of a real, silent failure.
 *
 * The Studio dropdown and the sending code each kept their own list of email
 * keys. They drifted: three keys were offered that nothing ever looked up
 * (`order-confirmation` among them — the most important email on the site), and
 * three keys the code did look up were not offered at all. A template written
 * against the wrong key saves happily and then never sends, so nothing surfaces
 * the mistake. The catalogue is now the single list; these check it stays sane.
 */
describe("email catalogue", () => {
  it("has no duplicate keys", () => {
    const keys = EMAIL_KINDS.map((kind) => kind.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("gives every stage-triggered email a stage", () => {
    for (const kind of EMAIL_KINDS) {
      if (kind.trigger === "stage") {
        expect(kind.stage, `${kind.key} is stage-triggered`).toBeTruthy();
      } else {
        expect(
          kind.stage,
          `${kind.key} is not stage-triggered`,
        ).toBeUndefined();
      }
    }
  });

  it("maps each stage to exactly one email", () => {
    const stages = EMAIL_KINDS.map((kind) => kind.stage).filter(Boolean);
    expect(new Set(stages).size).toBe(stages.length);
  });

  it("resolves the stages that should email the customer", () => {
    expect(emailKeyForOrderStage("production")).toBe("order-in-production");
    expect(emailKeyForOrderStage("tracking")).toBe("order-dispatched");
    expect(emailKeyForOrderStage("delivered")).toBe("order-delivered");
    expect(emailKeyForOrderStage("review_requested")).toBe(
      "order-review-request",
    );
    expect(emailKeyForOrderStage("on_hold")).toBe("order-delayed");
    expect(emailKeyForOrderStage("cancelled")).toBe("order-cancelled");
    expect(emailKeyForOrderStage("refunded")).toBe("order-refunded");
  });

  it("stays silent on the internal stages", () => {
    // Emailing on these would narrate Kaiku's supplier arrangements to the
    // customer, which is nobody's business but Kaiku's.
    for (const stage of [
      "paid",
      "review",
      "supplier_notified",
      "supplier_confirmed",
      "ready_dispatch",
      "in_transit",
      "follow_up",
      "closed",
    ]) {
      expect(emailKeyForOrderStage(stage), stage).toBeNull();
    }
  });

  it("offers every key in the dropdown, and only real ones", () => {
    // The bug this whole file is about: the dropdown offering a key nothing
    // reads, or omitting one the code does read.
    expect(EMAIL_KIND_OPTIONS.map((option) => option.value)).toEqual(
      EMAIL_KINDS.map((kind) => kind.key),
    );
    for (const option of EMAIL_KIND_OPTIONS) {
      expect(emailKindByKey(option.value)).toBeDefined();
    }
  });

  it("labels every dropdown entry with when it sends", () => {
    for (const option of EMAIL_KIND_OPTIONS) {
      expect(option.title).toContain("—");
      expect(option.title.length).toBeGreaterThan(10);
    }
  });

  it("covers the twelve emails the site actually sends", () => {
    expect(EMAIL_KINDS.map((kind) => kind.key)).toEqual([
      "order-confirmation",
      "second-order-offer",
      "order-in-production",
      "order-dispatched",
      "order-delivered",
      "order-review-request",
      "order-delayed",
      "order-cancelled",
      "order-refunded",
      "newsletter-welcome",
      "quote-received",
      "contact-received",
    ]);
  });

  it("returns undefined for a key that is not in the catalogue", () => {
    expect(emailKindByKey("order-abducted")).toBeUndefined();
  });
});
