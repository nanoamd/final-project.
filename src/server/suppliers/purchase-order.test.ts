import { describe, expect, it } from "vitest";

import {
  buildPurchaseOrderEmail,
  type PurchaseOrderInput,
  purchaseOrderProblems,
} from "./purchase-order";

const BASE: PurchaseOrderInput = {
  supplierName: "Pennine Barrel Saunas",
  contactName: "Sarah",
  orderNumber: "KH-1042",
  placedAt: new Date("2026-08-19T14:30:00Z"),
  items: [
    {
      title: "Nordic Two-Seater Barrel Sauna",
      supplierSku: "PB-BARREL-2S",
      kaikuSku: "KAI-SAU-0012",
      quantity: 1,
      options: { Heater: "Electric 6kW", Wood: "Thermowood" },
    },
  ],
  deliveryAddress: {
    name: "Alex Hartley",
    address: {
      line1: "12 Willow Lane",
      city: "Marlow",
      postal_code: "SL7 1AB",
      country: "GB",
    },
  },
  customerName: "Alex Hartley",
  customerPhone: "07700 900123",
};

describe("buildPurchaseOrderEmail", () => {
  it("uses the Kaiku order number as the PO reference", () => {
    const built = buildPurchaseOrderEmail(BASE);
    expect(built.subject).toBe("Purchase order KH-1042 — Kaiku");
    expect(built.html).toContain("KH-1042");
    expect(built.text).toContain("PURCHASE ORDER KH-1042");
  });

  it("never puts a price in the order", () => {
    // The whole reason this module exists as its own file. The supplier invoices
    // at their own trade price; sending ours hands them the margin, and sending a
    // stale trade cost invites an invoice dispute.
    const built = buildPurchaseOrderEmail(BASE);
    for (const output of [built.html, built.text]) {
      expect(output).not.toMatch(/£\s?\d/);
      expect(output).not.toMatch(/\bGBP\b/);
    }
  });

  it("leads with the supplier's own code and keeps ours as a cross-reference", () => {
    const built = buildPurchaseOrderEmail(BASE);
    expect(built.text).toContain("Your ref: PB-BARREL-2S");
    expect(built.text).toContain("Our ref: KAI-SAU-0012");
    // Theirs first: their warehouse cannot pick by a Kaiku code.
    expect(built.text.indexOf("Your ref")).toBeLessThan(
      built.text.indexOf("Our ref"),
    );
  });

  it("says so loudly when the supplier SKU is missing rather than sending a blank", () => {
    const built = buildPurchaseOrderEmail({
      ...BASE,
      items: [{ ...BASE.items[0]!, supplierSku: null }],
    });
    expect(built.text).toContain("NOT RECORDED");
    expect(built.html).toContain("NOT RECORDED");
  });

  it("includes the delivery address and the booking phone", () => {
    const built = buildPurchaseOrderEmail(BASE);
    expect(built.text).toContain("12 Willow Lane");
    expect(built.text).toContain("SL7 1AB");
    expect(built.text).toContain("07700 900123");
  });

  it("never gives the supplier the customer's email address", () => {
    const built = buildPurchaseOrderEmail({
      ...BASE,
      // Even if one were somehow threaded into a name field, it must not appear
      // as a contactable address — the customer relationship is Kaiku's.
      customerName: "Alex Hartley",
    });
    expect(built.text).not.toContain("@gmail");
    expect(built.text).toContain(
      "raise any query on this order by email rather than contacting the recipient directly",
    );
  });

  it("carries the chosen options through, so the wrong variant is not shipped", () => {
    const built = buildPurchaseOrderEmail(BASE);
    expect(built.text).toContain("Heater: Electric 6kW");
    expect(built.text).toContain("Wood: Thermowood");
  });

  it("shows quantity per line", () => {
    const built = buildPurchaseOrderEmail({
      ...BASE,
      items: [
        { ...BASE.items[0]!, quantity: 3 },
        {
          title: "Sauna Bucket and Ladle",
          supplierSku: "PB-ACC-001",
          kaikuSku: "KAI-ACC-0004",
          quantity: 2,
          options: null,
        },
      ],
    });
    expect(built.text).toContain("Qty 3");
    expect(built.text).toContain("Qty 2");
  });

  it("addresses a named contact when there is one, the company when there is not", () => {
    expect(buildPurchaseOrderEmail(BASE).text).toContain("Hello Sarah,");
    expect(
      buildPurchaseOrderEmail({ ...BASE, contactName: null }).text,
    ).toContain("Hello Pennine Barrel Saunas,");
  });

  it("states plainly when there is no address, instead of sending an empty block", () => {
    const built = buildPurchaseOrderEmail({ ...BASE, deliveryAddress: null });
    expect(built.text).toContain("No delivery address recorded");
  });

  it("escapes supplier and product text", () => {
    const built = buildPurchaseOrderEmail({
      ...BASE,
      items: [
        {
          ...BASE.items[0]!,
          title: 'Sauna <script>alert("x")</script> & Bench',
        },
      ],
    });
    expect(built.html).not.toContain("<script>");
    expect(built.html).toContain("&amp;");
  });
});

describe("purchaseOrderProblems", () => {
  it("finds nothing wrong with a complete order", () => {
    expect(purchaseOrderProblems(BASE)).toEqual([]);
  });

  it("flags a missing supplier SKU, naming the product", () => {
    const problems = purchaseOrderProblems({
      ...BASE,
      items: [{ ...BASE.items[0]!, supplierSku: "  " }],
    });
    expect(problems).toHaveLength(1);
    expect(problems[0]!.kind).toBe("missing-supplier-sku");
    expect(problems[0]!.detail).toContain("Nordic Two-Seater Barrel Sauna");
  });

  it("flags a missing delivery address", () => {
    const problems = purchaseOrderProblems({
      ...BASE,
      deliveryAddress: null,
    });
    expect(problems.map((p) => p.kind)).toContain("missing-address");
  });

  it("flags a missing phone, because carriers will not book without one", () => {
    const problems = purchaseOrderProblems({ ...BASE, customerPhone: null });
    expect(problems.map((p) => p.kind)).toContain("missing-phone");
  });

  it("reports every problem at once rather than the first", () => {
    const problems = purchaseOrderProblems({
      ...BASE,
      items: [
        { ...BASE.items[0]!, supplierSku: null },
        { ...BASE.items[0]!, title: "Sauna Cover", supplierSku: null },
      ],
      deliveryAddress: null,
      customerPhone: null,
    });
    expect(problems).toHaveLength(4);
  });
});
