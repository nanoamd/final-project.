import { describe, expect, it } from "vitest";

import {
  assessReturn,
  isFault,
  RETURN_WINDOWS,
  type ReturnRequest,
} from "./eligibility";

const NOW = new Date("2026-08-20T12:00:00Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

/** A straightforward change-of-mind on a stock item delivered two days ago. */
const BASE: ReturnRequest = {
  reason: "change-of-mind",
  deliveredAt: daysAgo(2),
  madeToOrder: false,
  productionStarted: false,
  unused: true,
  originalPackaging: true,
  photoCount: 0,
};

describe("isFault", () => {
  it("counts everything except changing your mind", () => {
    expect(isFault("change-of-mind")).toBe(false);
    for (const reason of [
      "faulty",
      "damaged-in-transit",
      "not-as-described",
      "wrong-item",
    ] as const) {
      expect(isFault(reason), reason).toBe(true);
    }
  });
});

describe("a fault is never auto-declined", () => {
  // The single most important property in this file. Declining a fault because
  // a policy window passed is unlawful, so no input may produce "decline".
  it("holds for every fault reason at every age, condition and evidence level", () => {
    for (const reason of [
      "faulty",
      "damaged-in-transit",
      "not-as-described",
      "wrong-item",
    ] as const) {
      for (const days of [0, 1, 3, 15, 29, 31, 90, 400]) {
        for (const unused of [true, false]) {
          for (const originalPackaging of [true, false]) {
            for (const photoCount of [0, 3]) {
              const assessment = assessReturn(
                {
                  ...BASE,
                  reason,
                  deliveredAt: daysAgo(days),
                  unused,
                  originalPackaging,
                  photoCount,
                },
                NOW,
              );
              expect(
                assessment.decision,
                `${reason} @ ${days}d unused=${unused} pkg=${originalPackaging} photos=${photoCount}`,
              ).not.toBe("decline");
            }
          }
        }
      }
    }
  });

  it("always puts the return shipping on Kaiku", () => {
    // "you are never out of pocket for a fault" — the published policy.
    for (const days of [0, 5, 200]) {
      const assessment = assessReturn(
        { ...BASE, reason: "faulty", deliveredAt: daysAgo(days) },
        NOW,
      );
      expect(assessment.returnShippingPaidBy).toBe("kaiku");
    }
  });
});

describe("faults reported promptly", () => {
  it("accepts a fault reported within the window", () => {
    const assessment = assessReturn(
      { ...BASE, reason: "faulty", deliveredAt: hoursAgo(6) },
      NOW,
    );
    expect(assessment.decision).toBe("accept");
    expect(assessment.supplierWindowLikelyClosed).toBe(false);
  });

  it("accepts transit damage when photographs are attached", () => {
    const assessment = assessReturn(
      {
        ...BASE,
        reason: "damaged-in-transit",
        deliveredAt: hoursAgo(6),
        photoCount: 4,
      },
      NOW,
    );
    expect(assessment.decision).toBe("accept");
  });

  it("sends transit damage with no photographs to a human, not to a refusal", () => {
    const assessment = assessReturn(
      {
        ...BASE,
        reason: "damaged-in-transit",
        deliveredAt: hoursAgo(6),
        photoCount: 0,
      },
      NOW,
    );
    expect(assessment.decision).toBe("review");
    expect(assessment.notes.join(" ")).toContain("photograph");
  });
});

describe("faults reported late", () => {
  it("flags the supplier window without touching the customer's rights", () => {
    const assessment = assessReturn(
      { ...BASE, reason: "faulty", deliveredAt: daysAgo(10) },
      NOW,
    );
    expect(assessment.decision).toBe("review");
    expect(assessment.supplierWindowLikelyClosed).toBe(true);
    expect(assessment.returnShippingPaidBy).toBe("kaiku");
    expect(assessment.notes.join(" ")).toContain("Kaiku carries the cost");
  });

  it("says the remedy narrows after 30 days, and still accepts the claim", () => {
    const assessment = assessReturn(
      { ...BASE, reason: "faulty", deliveredAt: daysAgo(45) },
      NOW,
    );
    expect(assessment.decision).toBe("review");
    expect(assessment.notes.join(" ")).toContain("repair or replacement");
  });

  it("offers the short-term right to reject inside 30 days", () => {
    const assessment = assessReturn(
      { ...BASE, reason: "faulty", deliveredAt: daysAgo(20) },
      NOW,
    );
    expect(assessment.notes.join(" ")).toContain("short-term right to reject");
  });
});

describe("change of mind", () => {
  it("accepts an unused item in its packaging inside the window", () => {
    const assessment = assessReturn(BASE, NOW);
    expect(assessment.decision).toBe("accept");
    expect(assessment.returnShippingPaidBy).toBe("customer");
  });

  it("tells the customer not to post it before they have a reference", () => {
    // The policy is explicit: an unannounced delivery to a supplier's warehouse
    // can be refused, and then the customer has lost the item and the refund.
    expect(assessReturn(BASE, NOW).customerMessage).toContain("reference");
  });

  it("accepts on the last day of the window", () => {
    const assessment = assessReturn(
      { ...BASE, deliveredAt: daysAgo(RETURN_WINDOWS.cancellationDays) },
      NOW,
    );
    expect(assessment.decision).toBe("accept");
  });

  it("declines the day after the window closes", () => {
    const assessment = assessReturn(
      { ...BASE, deliveredAt: daysAgo(RETURN_WINDOWS.cancellationDays + 1) },
      NOW,
    );
    expect(assessment.decision).toBe("decline");
  });

  it("points a declined customer at the fault route, which has no deadline", () => {
    const assessment = assessReturn({ ...BASE, deliveredAt: daysAgo(60) }, NOW);
    expect(assessment.decision).toBe("decline");
    expect(assessment.customerMessage).toContain("anything actually wrong");
  });

  it("reviews rather than refuses when it has been used", () => {
    // The law allows a reduced refund for handling, not a refusal.
    const assessment = assessReturn({ ...BASE, unused: false }, NOW);
    expect(assessment.decision).toBe("review");
    expect(assessment.notes.join(" ")).toContain("reduced");
  });

  it("reviews rather than refuses when the packaging has gone", () => {
    const assessment = assessReturn({ ...BASE, originalPackaging: false }, NOW);
    expect(assessment.decision).toBe("review");
  });

  it("accepts a cancellation before delivery", () => {
    const assessment = assessReturn({ ...BASE, deliveredAt: null }, NOW);
    expect(assessment.decision).toBe("accept");
    expect(assessment.daysSinceDelivery).toBeNull();
  });
});

describe("made to order", () => {
  it("reviews rather than refuses once production has started", () => {
    // The policy says it cannot be cancelled "unless required by law", and that
    // caveat matters: only genuinely bespoke goods lose the statutory right.
    const assessment = assessReturn(
      { ...BASE, madeToOrder: true, productionStarted: true },
      NOW,
    );
    expect(assessment.decision).toBe("review");
    expect(assessment.notes.join(" ")).toContain("reg. 28");
  });

  it("treats it normally before production starts", () => {
    const assessment = assessReturn(
      { ...BASE, madeToOrder: true, productionStarted: false },
      NOW,
    );
    expect(assessment.decision).toBe("accept");
  });

  it("still never declines a fault on a made-to-order item in production", () => {
    const assessment = assessReturn(
      {
        ...BASE,
        reason: "faulty",
        madeToOrder: true,
        productionStarted: true,
        deliveredAt: daysAgo(200),
      },
      NOW,
    );
    expect(assessment.decision).not.toBe("decline");
    expect(assessment.returnShippingPaidBy).toBe("kaiku");
  });
});

describe("every assessment explains itself", () => {
  it("always carries at least one note and a customer message", () => {
    const cases: ReturnRequest[] = [
      BASE,
      { ...BASE, deliveredAt: daysAgo(60) },
      { ...BASE, reason: "faulty" },
      { ...BASE, reason: "damaged-in-transit", photoCount: 0 },
      { ...BASE, madeToOrder: true, productionStarted: true },
      { ...BASE, deliveredAt: null },
      { ...BASE, unused: false },
    ];
    for (const request of cases) {
      const assessment = assessReturn(request, NOW);
      expect(assessment.notes.length).toBeGreaterThan(0);
      expect(assessment.customerMessage.length).toBeGreaterThan(20);
    }
  });
});
