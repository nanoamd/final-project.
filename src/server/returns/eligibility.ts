/**
 * Whether a return can go ahead, and who pays for it.
 *
 * This encodes two things that are easy to confuse and expensive to get wrong:
 *
 * 1. **What the customer is legally entitled to.** Set by the Consumer Contracts
 *    Regulations 2013 (14 days to change your mind) and the Consumer Rights Act
 *    2015 (30 days to reject faulty goods outright, and repair or replacement
 *    after that). Kaiku cannot shorten either by writing a policy.
 * 2. **Whether the supplier will still accept a claim.** Kaiku's published policy
 *    asks customers to report damage within 48 hours because "our suppliers set
 *    their own windows for damage claims, and some are as short as three working
 *    days from delivery".
 *
 * These are not the same question, and the second must never be allowed to
 * answer the first. A customer who reports a fault on day 20 is still entitled
 * to a remedy; what has changed is that Kaiku, not the supplier, may end up
 * carrying the cost. Code that declined that return would be unlawful — so
 * nothing here ever auto-declines a fault. The worst outcome for a fault is
 * "a human should look at this".
 *
 * Deliberately conservative in the customer's favour wherever the law is open to
 * reading. That is both the safer legal position and the better service, and the
 * two point the same way more often than people expect.
 *
 * **Not legal advice.** This implements Kaiku's published returns policy as
 * written, plus the statutory minimums above. Damien should have the policy
 * itself reviewed by someone qualified; this module's job is to make sure the
 * site never behaves *worse* than the policy it publishes.
 */

/** Why the customer wants to send it back, in their words. */
export type ReturnReason =
  | "change-of-mind"
  | "faulty"
  | "damaged-in-transit"
  | "not-as-described"
  | "wrong-item";

/** A fault is anything that is not the customer simply changing their mind. */
export function isFault(reason: ReturnReason): boolean {
  return reason !== "change-of-mind";
}

export interface ReturnRequest {
  reason: ReturnReason;
  /** When the customer actually received it. Null when not yet delivered. */
  deliveredAt: Date | null;
  /** Made to order, so cancellation rights may differ once production starts. */
  madeToOrder: boolean;
  /** Whether the supplier has begun making it. */
  productionStarted: boolean;
  /** From the questionnaire — change-of-mind returns require both. */
  unused: boolean;
  originalPackaging: boolean;
  /** Photographs the customer attached. Evidence for a damage claim. */
  photoCount: number;
}

export type ReturnDecision =
  /** Meets the policy outright. Issue the return reference. */
  | "accept"
  /** A person must decide. Never a refusal — just not automatic. */
  | "review"
  /** Outside every entitlement Kaiku offers. Only ever change-of-mind. */
  | "decline";

export interface ReturnAssessment {
  decision: ReturnDecision;
  /** Who bears the cost of shipping it back. */
  returnShippingPaidBy: "kaiku" | "customer";
  /** What the customer should be told, in plain words. */
  customerMessage: string;
  /** Why, for the timeline and for Damien. One line per reason. */
  notes: string[];
  /** True when the supplier's own claim window has probably closed. */
  supplierWindowLikelyClosed: boolean;
  /** Days since delivery, or null if it has not arrived. */
  daysSinceDelivery: number | null;
}

/**
 * Statutory and policy windows, named so the reasoning is visible.
 *
 * `cancellationDays` and `shortTermRejectDays` are statutory minimums — lowering
 * either would make the site unlawful, which is why they are not configuration.
 */
export const RETURN_WINDOWS = {
  /** Consumer Contracts Regulations 2013: 14 days from receipt to cancel. */
  cancellationDays: 14,
  /** Consumer Rights Act 2015: 30-day short-term right to reject. */
  shortTermRejectDays: 30,
  /** Kaiku's published request, and roughly the tightest supplier window. */
  reportDamageHours: 48,
} as const;

const DAY = 24 * 60 * 60 * 1000;

function wholeDaysBetween(from: Date, to: Date): number {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY));
}

export function assessReturn(
  request: ReturnRequest,
  now: Date = new Date(),
): ReturnAssessment {
  const notes: string[] = [];
  const daysSinceDelivery = request.deliveredAt
    ? wholeDaysBetween(request.deliveredAt, now)
    : null;

  // ---------------------------------------------------------------------------
  // Faults. Kaiku pays the return either way — "you are never out of pocket for
  // a fault", per the published policy — and no fault is ever auto-declined.
  // ---------------------------------------------------------------------------
  if (isFault(request.reason)) {
    const hoursSince =
      request.deliveredAt !== null
        ? (now.getTime() - request.deliveredAt.getTime()) / (60 * 60 * 1000)
        : 0;
    const supplierWindowLikelyClosed =
      request.deliveredAt !== null &&
      hoursSince > RETURN_WINDOWS.reportDamageHours;

    if (supplierWindowLikelyClosed) {
      notes.push(
        `Reported ${Math.floor(hoursSince / 24)} days after delivery, past the ${RETURN_WINDOWS.reportDamageHours}-hour window the policy asks for. ` +
          "The supplier may refuse the claim, in which case Kaiku carries the cost — the customer's rights are unaffected.",
      );
    }

    if (request.reason === "damaged-in-transit" && request.photoCount === 0) {
      notes.push(
        "No photographs attached. A transit-damage claim is very unlikely to succeed with the carrier or supplier without them — ask before rejecting the claim.",
      );
    }

    const withinShortTermReject =
      daysSinceDelivery === null ||
      daysSinceDelivery <= RETURN_WINDOWS.shortTermRejectDays;

    if (withinShortTermReject) {
      notes.push(
        `Within the ${RETURN_WINDOWS.shortTermRejectDays}-day short-term right to reject (Consumer Rights Act 2015): the customer may choose a full refund.`,
      );
    } else {
      notes.push(
        `Past ${RETURN_WINDOWS.shortTermRejectDays} days, so the remedy is repair or replacement first (Consumer Rights Act 2015) rather than an automatic refund. Still a valid claim.`,
      );
    }

    // Photographs and an in-window report is the clean case; everything else
    // wants a person, but never a refusal.
    const clean =
      !supplierWindowLikelyClosed &&
      (request.reason !== "damaged-in-transit" || request.photoCount > 0);

    return {
      decision: clean ? "accept" : "review",
      returnShippingPaidBy: "kaiku",
      customerMessage: clean
        ? "We're sorry — that shouldn't have happened. We'll cover the return and come back to you with the next step within one working day."
        : "We're sorry — that shouldn't have happened. We're looking into it and will come back to you within one working day. You won't be out of pocket.",
      notes,
      supplierWindowLikelyClosed,
      daysSinceDelivery,
    };
  }

  // ---------------------------------------------------------------------------
  // Change of mind. Here a decline is possible, because the entitlement really
  // does expire — but every edge goes to review rather than a flat no.
  // ---------------------------------------------------------------------------
  const customerPays = "customer" as const;

  // Made to order and already in production. The policy says this cannot be
  // cancelled "unless required by law" — and that caveat is doing real work, so
  // this is never an automatic refusal.
  if (request.madeToOrder && request.productionStarted) {
    notes.push(
      "Made to order and already in production. The policy says this cannot be cancelled, but only a genuinely bespoke or personalised item loses the statutory cancellation right (Consumer Contracts Regulations 2013, reg. 28). A standard product built to order on demand usually keeps it.",
    );
    return {
      decision: "review",
      returnShippingPaidBy: customerPays,
      customerMessage:
        "This one is made to order and already in production, so we need to check what's possible with the workshop. We'll come back to you within one working day.",
      notes,
      supplierWindowLikelyClosed: false,
      daysSinceDelivery,
    };
  }

  // Not delivered yet. The cancellation right starts at delivery and runs from
  // the moment of ordering, so cancelling early is always allowed.
  if (request.deliveredAt === null) {
    notes.push(
      "Not yet delivered. The cancellation right runs from the order until 14 days after delivery, so cancelling now is within it.",
    );
    return {
      decision: "accept",
      returnShippingPaidBy: customerPays,
      customerMessage:
        "That's no problem — we'll stop the order where we can and confirm by email.",
      notes,
      supplierWindowLikelyClosed: false,
      daysSinceDelivery,
    };
  }

  const days = daysSinceDelivery ?? 0;

  if (days > RETURN_WINDOWS.cancellationDays) {
    notes.push(
      `${days} days since delivery, past the ${RETURN_WINDOWS.cancellationDays}-day cancellation window.`,
    );
    return {
      decision: "decline",
      returnShippingPaidBy: customerPays,
      customerMessage: `Our change-of-mind window is ${RETURN_WINDOWS.cancellationDays} days from delivery and this order was delivered ${days} days ago, so we can't accept it as a change of mind. If there's anything actually wrong with it, tell us — that's a different thing entirely and has no such deadline.`,
      notes,
      supplierWindowLikelyClosed: false,
      daysSinceDelivery,
    };
  }

  // In window. The condition questions decide automatic versus a look.
  if (!request.unused || !request.originalPackaging) {
    notes.push(
      request.unused
        ? "In window, but not in its original packaging. The policy requires it; a partial refund may be fair rather than a refusal."
        : "In window, but reported as used. The law allows the refund to be reduced to reflect handling beyond what is needed to examine it — not a refusal.",
    );
    return {
      decision: "review",
      returnShippingPaidBy: customerPays,
      customerMessage:
        "Thanks — we've got your request. There's one thing we need to check before confirming, and we'll come back to you within one working day.",
      notes,
      supplierWindowLikelyClosed: false,
      daysSinceDelivery,
    };
  }

  notes.push(
    `Within the ${RETURN_WINDOWS.cancellationDays}-day window, unused and in its original packaging.`,
  );
  return {
    decision: "accept",
    returnShippingPaidBy: customerPays,
    customerMessage:
      "That's all fine. We'll email you the return address and the reference the warehouse needs — please don't send anything back until you have it, or the delivery may be refused.",
    notes,
    supplierWindowLikelyClosed: false,
    daysSinceDelivery,
  };
}
