import { describe, expect, it } from "vitest";

import type { OrderEmailData } from "./format";
import {
  buildStageEmail,
  emailKeyForStage,
  stageVariables,
} from "./order-stage";

const order: OrderEmailData = {
  orderId: "abc-123",
  placedAt: new Date("2026-08-01T10:00:00Z"),
  customerName: "Damien McCormack",
  customerEmail: "d@example.com",
  customerPhone: null,
  amountTotal: 637900,
  currency: "gbp",
  items: [
    {
      description: "SaunaPlunge™ Pennine Barrel 6-Person Outdoor Sauna",
      quantity: 1,
      amountTotal: 637900,
      leadTime: "4–6 weeks",
      slug: "pennine-barrel",
      sku: "SP-PB6",
      supplier: "SaunaPlunge",
      selectedOptions: null,
    },
  ],
  shippingAddress: null,
  siteUrl: "https://kaikuhome.com",
};

describe("emailKeyForStage", () => {
  it("notifies on the stages a customer cares about", () => {
    expect(emailKeyForStage("production")).toBe("order-in-production");
    expect(emailKeyForStage("tracking")).toBe("order-dispatched");
    expect(emailKeyForStage("delivered")).toBe("order-delivered");
    expect(emailKeyForStage("on_hold")).toBe("order-delayed");
    expect(emailKeyForStage("cancelled")).toBe("order-cancelled");
    expect(emailKeyForStage("refunded")).toBe("order-refunded");
  });

  it("stays silent on internal bookkeeping stages", () => {
    // Emailing these would narrate Kaiku's supplier arrangements to the
    // customer, which is nobody's business but Kaiku's.
    for (const stage of [
      "review",
      "supplier_notified",
      "supplier_confirmed",
      "ready_dispatch",
      "follow_up",
      "closed",
    ])
      expect(emailKeyForStage(stage)).toBeNull();
  });

  it("stays silent on `paid`, because the Stripe webhook already confirmed", () => {
    expect(emailKeyForStage("paid")).toBeNull();
  });
});

describe("buildStageEmail", () => {
  it("returns null for an internal stage rather than an empty email", () => {
    expect(buildStageEmail("supplier_notified", order)).toBeNull();
  });

  it("greets by first name only", () => {
    const html = buildStageEmail("production", order)!.html;
    expect(html).toContain("Hello Damien,");
    expect(html).not.toContain("Hello Damien McCormack");
  });

  it("falls back to 'there' when there is no name", () => {
    const html = buildStageEmail("production", {
      ...order,
      customerName: null,
    })!.html;
    expect(html).toContain("Hello there,");
  });

  describe("dispatched", () => {
    it("includes carrier, tracking number and a tracking button", () => {
      const built = buildStageEmail("tracking", order, {
        trackingCarrier: "DX Freight",
        trackingNumber: "DX99887766",
        trackingUrl: "https://dx.example/track/DX99887766",
      })!;
      expect(built.html).toContain("DX Freight");
      expect(built.html).toContain("DX99887766");
      expect(built.html).toContain("https://dx.example/track/DX99887766");
      expect(built.subject).toBe("Your order is on its way");
    });

    it("promises a carrier call instead of a dead link when there is no URL", () => {
      const built = buildStageEmail("tracking", order, {
        trackingCarrier: "DX Freight",
        trackingNumber: "DX99887766",
      })!;
      expect(built.html).toContain("arrange a delivery slot");
      expect(built.html).not.toContain("Track with the carrier");
    });

    it("puts the tracking number in the inbox preview text", () => {
      const built = buildStageEmail("tracking", order, {
        trackingNumber: "DX99887766",
      })!;
      expect(built.html).toContain("DX99887766");
    });
  });

  describe("delayed", () => {
    it("says it is not cancelled and offers a full refund", () => {
      const built = buildStageEmail("on_hold", order, {
        note: "The workshop is three weeks behind on cedar.",
      })!;
      expect(built.html).toContain("not cancelled");
      expect(built.html).toContain("refund it in full");
      expect(built.html).toContain("three weeks behind on cedar");
    });

    it("still sends something useful with no explanatory note", () => {
      const built = buildStageEmail("on_hold", order)!;
      expect(built.html).toContain("taking longer than we quoted");
    });
  });

  describe("refunded", () => {
    it("states the amount and sets an expectation for when it lands", () => {
      const built = buildStageEmail("refunded", order)!;
      expect(built.html).toContain("£6,379.00");
      expect(built.html).toContain("five to ten working days");
    });
  });

  describe("cancelled", () => {
    it("lists what was cancelled", () => {
      const built = buildStageEmail("cancelled", order)!;
      expect(built.html).toContain("Pennine Barrel");
      expect(built.html).toContain("refunded to the card you paid with");
    });
  });

  it("escapes customer-supplied text so it cannot break the markup", () => {
    const built = buildStageEmail("on_hold", order, {
      note: 'Delayed <script>alert("x")</script>',
    })!;
    expect(built.html).not.toContain("<script>");
    expect(built.html).toContain("&lt;script&gt;");
  });

  it("always links to the order's own tracking page and quotes the reference", () => {
    const built = buildStageEmail("delivered", order)!;
    expect(built.html).toContain("https://kaikuhome.com/track/abc-123");
    expect(built.html).toContain("abc-123");
  });

  it("produces a plain-text alternative with no markup", () => {
    const built = buildStageEmail("tracking", order, {
      trackingNumber: "DX1",
    })!;
    expect(built.text).toContain("DX1");
    expect(built.text).not.toContain("<table");
    expect(built.text).not.toContain("<p");
  });
});

describe("stageVariables", () => {
  it("exposes the order facts a Studio template can use", () => {
    const vars = stageVariables(order, {
      trackingNumber: "DX1",
      trackingCarrier: "DX",
      trackingUrl: "https://dx.example/1",
    });
    expect(vars.customerName).toBe("Damien McCormack");
    expect(vars.orderNumber).toBe("abc-123");
    expect(vars.orderTotal).toBe("£6,379.00");
    expect(vars.trackingNumber).toBe("DX1");
    expect(vars.carrier).toBe("DX");
    expect(vars.orderStatusUrl).toBe("https://kaikuhome.com/track/abc-123");
  });

  it("returns null for tracking details that do not exist yet", () => {
    const vars = stageVariables(order, {});
    // null, not "" — the renderer leaves an unresolved variable visible and
    // drops a button that would otherwise be dead.
    expect(vars.trackingUrl).toBeNull();
    expect(vars.trackingNumber).toBeNull();
  });

  it("falls back to a usable greeting name", () => {
    expect(
      stageVariables({ ...order, customerName: null }, {}).customerName,
    ).toBe("there");
  });
});
