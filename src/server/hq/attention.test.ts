import { describe, expect, it } from "vitest";

import {
  assessOrder,
  assessOrders,
  assessReturns,
  attentionCounts,
  type AttentionOrder,
  type AttentionReturn,
  businessDaysBetween,
} from "./attention";

const NOW = new Date("2026-08-19T12:00:00Z"); // A Wednesday.

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}

/** A healthy in-flight order: ordered, confirmed, dated, nothing overdue. */
const HEALTHY: AttentionOrder = {
  id: "11111111-2222-3333-4444-555555555555",
  orderNumber: "KH-1042",
  email: "alex@example.com",
  customerName: "Alex Hartley",
  amountTotal: 637900,
  createdAt: daysAgo(3),
  stage: "production",
  flagged: false,
  promisedDispatchDate: "2026-09-10",
  promisedDeliveryDate: "2026-09-14",
  actualDeliveryDate: null,
  trackingNumber: null,
  reviewRequestedAt: null,
  purchaseOrderSent: true,
  suppliersAwaitingOrder: [],
  supplierNotifiedAt: daysAgo(3),
  supplierConfirmedAt: daysAgo(2),
};

describe("businessDaysBetween", () => {
  it("counts weekdays only", () => {
    // Mon 17th -> Wed 19th is two working days.
    expect(
      businessDaysBetween(
        new Date("2026-08-17T09:00:00Z"),
        new Date("2026-08-19T09:00:00Z"),
      ),
    ).toBe(2);
  });

  it("does not make a supplier late over a weekend", () => {
    // Friday afternoon to Sunday morning is nobody's fault.
    expect(
      businessDaysBetween(
        new Date("2026-08-14T16:00:00Z"),
        new Date("2026-08-16T09:00:00Z"),
      ),
    ).toBe(0);
  });

  it("counts Friday to Monday as one working day", () => {
    expect(
      businessDaysBetween(
        new Date("2026-08-14T09:00:00Z"),
        new Date("2026-08-17T09:00:00Z"),
      ),
    ).toBe(1);
  });

  it("is zero when to is before or equal to from", () => {
    const d = new Date("2026-08-19T09:00:00Z");
    expect(businessDaysBetween(d, d)).toBe(0);
    expect(businessDaysBetween(d, new Date("2026-08-18T09:00:00Z"))).toBe(0);
  });
});

describe("assessOrder", () => {
  it("says nothing about a healthy order", () => {
    expect(assessOrder(HEALTHY, NOW)).toEqual([]);
  });

  it("raises a critical when paid and nothing is on order", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        stage: "paid",
        purchaseOrderSent: false,
        suppliersAwaitingOrder: ["Pennine Barrel Saunas"],
        supplierNotifiedAt: null,
        supplierConfirmedAt: null,
        createdAt: hoursAgo(20),
      },
      NOW,
    );
    const unordered = items.find((i) => i.id.endsWith(":unordered"));
    expect(unordered?.severity).toBe("critical");
    expect(unordered?.detail).toContain("KH-1042");
    expect(unordered?.detail).toContain("Pennine Barrel Saunas");
  });

  it("gives a new order a few hours before shouting about it", () => {
    // An order placed an hour ago is not a failure of service.
    const items = assessOrder(
      {
        ...HEALTHY,
        stage: "paid",
        purchaseOrderSent: false,
        supplierNotifiedAt: null,
        supplierConfirmedAt: null,
        createdAt: hoursAgo(2),
      },
      NOW,
    );
    expect(items.map((i) => i.id)).not.toContain(`${HEALTHY.id}:unordered`);
  });

  it("chases a supplier who has not confirmed in two working days", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        supplierNotifiedAt: "2026-08-17T09:00:00Z", // Monday
        supplierConfirmedAt: null,
      },
      NOW,
    );
    const silent = items.find((i) => i.id.endsWith(":supplier-silent"));
    expect(silent?.severity).toBe("warning");
    expect(silent?.detail).toContain("2 working days ago");
  });

  it("does not chase a supplier notified yesterday", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        supplierNotifiedAt: "2026-08-18T09:00:00Z", // Tuesday
        supplierConfirmedAt: null,
      },
      NOW,
    );
    expect(items.map((i) => i.id)).not.toContain(
      `${HEALTHY.id}:supplier-silent`,
    );
  });

  it("raises a critical when the promised dispatch date passed with no tracking", () => {
    const items = assessOrder(
      { ...HEALTHY, promisedDispatchDate: "2026-08-17", trackingNumber: null },
      NOW,
    );
    const late = items.find((i) => i.id.endsWith(":dispatch-late"));
    expect(late?.severity).toBe("critical");
    expect(late?.detail).toContain("2 days over");
  });

  it("stays quiet once tracking exists, even if the date passed", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        promisedDispatchDate: "2026-08-17",
        trackingNumber: "AB123456789GB",
      },
      NOW,
    );
    expect(items.map((i) => i.id)).not.toContain(`${HEALTHY.id}:dispatch-late`);
  });

  it("does not call a date promised for today late", () => {
    // Day-granular: a delivery promised today is not overdue at midday.
    const items = assessOrder(
      { ...HEALTHY, promisedDeliveryDate: "2026-08-19" },
      NOW,
    );
    expect(items.map((i) => i.id)).not.toContain(`${HEALTHY.id}:delivery-late`);
  });

  it("raises a critical when the delivery date passed and nothing was recorded", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        promisedDeliveryDate: "2026-08-15",
        actualDeliveryDate: null,
      },
      NOW,
    );
    expect(items.find((i) => i.id.endsWith(":delivery-late"))?.severity).toBe(
      "critical",
    );
  });

  it("stops once the delivery is recorded", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        promisedDeliveryDate: "2026-08-15",
        actualDeliveryDate: "2026-08-15",
        reviewRequestedAt: daysAgo(1),
      },
      NOW,
    );
    expect(items.map((i) => i.id)).not.toContain(`${HEALTHY.id}:delivery-late`);
  });

  it("warns when a paid order has no promised dates at all", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        createdAt: daysAgo(3),
        promisedDispatchDate: null,
        promisedDeliveryDate: null,
      },
      NOW,
    );
    const noDates = items.find((i) => i.id.endsWith(":no-dates"));
    expect(noDates?.severity).toBe("warning");
    expect(noDates?.consequence).toContain("no date to plan around");
  });

  it("asks for a review a week after delivery, once", () => {
    const delivered = {
      ...HEALTHY,
      stage: "delivered",
      actualDeliveryDate: daysAgo(8),
      promisedDeliveryDate: daysAgo(9),
    };
    expect(
      assessOrder(delivered, NOW).find((i) => i.id.endsWith(":review-due")),
    ).toBeDefined();
    expect(
      assessOrder({ ...delivered, reviewRequestedAt: daysAgo(1) }, NOW).map(
        (i) => i.id,
      ),
    ).not.toContain(`${HEALTHY.id}:review-due`);
  });

  it("does not ask for a review the day after delivery", () => {
    const items = assessOrder(
      { ...HEALTHY, actualDeliveryDate: daysAgo(1) },
      NOW,
    );
    expect(items.map((i) => i.id)).not.toContain(`${HEALTHY.id}:review-due`);
  });

  it("goes quiet on cancelled and refunded orders", () => {
    for (const stage of ["cancelled", "refunded", "closed"]) {
      const items = assessOrder(
        {
          ...HEALTHY,
          stage,
          purchaseOrderSent: false,
          promisedDeliveryDate: "2026-08-01",
          supplierNotifiedAt: null,
          supplierConfirmedAt: null,
        },
        NOW,
      );
      expect(items, stage).toEqual([]);
    }
  });

  it("still reports a flagged order even when closed", () => {
    // Flagging is a deliberate human act; silencing it would lose the note.
    const items = assessOrder(
      { ...HEALTHY, stage: "closed", flagged: true },
      NOW,
    );
    expect(items.map((i) => i.id)).toContain(`${HEALTHY.id}:flagged`);
  });

  it("reports every problem on one order, not just the first", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        stage: "paid",
        createdAt: daysAgo(6),
        purchaseOrderSent: false,
        supplierNotifiedAt: null,
        supplierConfirmedAt: null,
        promisedDispatchDate: "2026-08-14",
        promisedDeliveryDate: "2026-08-16",
        flagged: true,
      },
      NOW,
    );
    expect(items.map((i) => i.id.split(":")[1]).sort()).toEqual([
      "delivery-late",
      "dispatch-late",
      "flagged",
      "unordered",
    ]);
  });

  it("falls back to a short id when there is no order number", () => {
    const items = assessOrder(
      {
        ...HEALTHY,
        orderNumber: null,
        stage: "paid",
        purchaseOrderSent: false,
        supplierNotifiedAt: null,
        supplierConfirmedAt: null,
      },
      NOW,
    );
    expect(items[0]!.detail).toContain("11111111");
  });

  it("names the customer, falling back to their email", () => {
    const flagged = { ...HEALTHY, flagged: true };
    expect(
      assessOrder(flagged, NOW).find((i) => i.id.endsWith(":flagged"))?.detail,
    ).toContain("Alex Hartley");
    expect(
      assessOrder({ ...flagged, customerName: null }, NOW).find((i) =>
        i.id.endsWith(":flagged"),
      )?.detail,
    ).toContain("alex@example.com");
  });
});

describe("assessOrders", () => {
  it("puts criticals first, most overdue first within a severity", () => {
    const items = assessOrders(
      [
        { ...HEALTHY, id: "a", actualDeliveryDate: daysAgo(30) }, // due
        {
          ...HEALTHY,
          id: "b",
          promisedDeliveryDate: "2026-08-18", // 1 day over
          actualDeliveryDate: null,
        },
        {
          ...HEALTHY,
          id: "c",
          promisedDeliveryDate: "2026-08-01", // 18 days over
          actualDeliveryDate: null,
        },
      ],
      NOW,
    );
    expect(items[0]!.severity).toBe("critical");
    expect(items[0]!.orderId).toBe("c");
    expect(items[1]!.orderId).toBe("b");
    expect(items.at(-1)!.severity).toBe("due");
  });

  it("returns nothing when everything is healthy", () => {
    expect(assessOrders([HEALTHY, { ...HEALTHY, id: "b" }], NOW)).toEqual([]);
  });
});

describe("attentionCounts", () => {
  it("counts per severity and in total", () => {
    const items = assessOrders(
      [
        {
          ...HEALTHY,
          id: "a",
          promisedDeliveryDate: "2026-08-01",
          actualDeliveryDate: null,
        },
        { ...HEALTHY, id: "b", flagged: true },
        { ...HEALTHY, id: "c", actualDeliveryDate: daysAgo(20) },
      ],
      NOW,
    );
    expect(attentionCounts(items)).toEqual({
      critical: 1,
      warning: 1,
      due: 1,
      total: 3,
    });
  });

  it("is all zeroes on a quiet day", () => {
    expect(attentionCounts([])).toEqual({
      critical: 0,
      warning: 0,
      due: 0,
      total: 0,
    });
  });
});

/** A return raised this morning, awaiting a decision. */
const OPEN_RETURN: AttentionReturn = {
  id: "ret-1",
  returnNumber: "KR-1001",
  orderId: "11111111-2222-3333-4444-555555555555",
  orderNumber: "KH-1042",
  customerName: "Alex Hartley",
  email: "alex@example.com",
  reason: "damaged-in-transit",
  decision: "review",
  status: "requested",
  supplierWindowLikelyClosed: false,
  createdAt: hoursAgo(3),
};

describe("assessReturns", () => {
  it("raises a return that needs a decision", () => {
    const items = assessReturns([OPEN_RETURN], NOW);
    expect(items).toHaveLength(1);
    expect(items[0]!.title).toContain("waiting on your decision");
    expect(items[0]!.detail).toContain("KR-1001");
    expect(items[0]!.detail).toContain("KH-1042");
  });

  it("escalates once the promised working day has passed", () => {
    // The customer was told "within one working day". Nothing else enforces it.
    expect(assessReturns([OPEN_RETURN], NOW)[0]!.severity).toBe("warning");
    expect(
      assessReturns(
        [{ ...OPEN_RETURN, createdAt: "2026-08-17T09:00:00Z" }],
        NOW,
      )[0]!.severity,
    ).toBe("critical");
  });

  it("treats a closed supplier window as urgent from the start", () => {
    // Here the delay costs Kaiku money rather than goodwill, which is worse.
    const items = assessReturns(
      [{ ...OPEN_RETURN, supplierWindowLikelyClosed: true }],
      NOW,
    );
    expect(items[0]!.severity).toBe("critical");
    expect(items[0]!.consequence).toContain("Kaiku absorbs");
  });

  it("says nothing about a return that was auto-accepted", () => {
    // Accepted returns need no decision; they need the item to arrive.
    const items = assessReturns(
      [{ ...OPEN_RETURN, decision: "accept", status: "approved" }],
      NOW,
    );
    expect(items).toEqual([]);
  });

  it("chases an approved return that never came back", () => {
    const items = assessReturns(
      [
        {
          ...OPEN_RETURN,
          decision: "accept",
          status: "approved",
          createdAt: daysAgo(21),
        },
      ],
      NOW,
    );
    expect(items[0]!.title).toContain("has not come back");
  });

  it("treats received-but-unrefunded as critical", () => {
    // They have handed the goods back and are out of pocket.
    const items = assessReturns(
      [{ ...OPEN_RETURN, status: "received", createdAt: daysAgo(3) }],
      NOW,
    );
    expect(items[0]!.severity).toBe("critical");
    expect(items[0]!.consequence).toContain("chargeback");
  });

  it("goes quiet once the return is finished", () => {
    for (const status of ["refunded", "replaced", "rejected"]) {
      expect(
        assessReturns(
          [{ ...OPEN_RETURN, status, createdAt: daysAgo(30) }],
          NOW,
        ),
        status,
      ).toEqual([]);
    }
  });

  it("returns nothing when there are no returns", () => {
    expect(assessReturns([], NOW)).toEqual([]);
  });
});
