/**
 * What needs Damien right now, and why it matters to a customer.
 *
 * "it needs to have enough functions to make the customer say wow this is
 * amazing service." Amazing service is not a feature — it is the absence of
 * silence. Every rule below exists because of a specific way a customer finds
 * out something has gone wrong *before Kaiku does*: they paid and nothing was
 * ordered, the dispatch date they were given passed without a word, the delivery
 * date passed and nobody rang. Each rule catches one of those a day or two
 * early, while it is still a good-service story rather than a complaint.
 *
 * A pure function over plain data, deliberately: these rules decide what the
 * operator gets told, so they are worth testing exhaustively, and none of them
 * should need a database to reason about.
 */

export type AttentionSeverity = "critical" | "warning" | "due";

export interface AttentionItem {
  /** Stable per order+rule, so the same problem is one row, not many. */
  id: string;
  severity: AttentionSeverity;
  /** What is wrong, in the operator's language. */
  title: string;
  /** Which customer and how late, so it can be triaged without opening it. */
  detail: string;
  /** Why it matters — the customer consequence, not the internal state. */
  consequence: string;
  orderId: string;
  orderNumber: string | null;
  /** For sorting within a severity: bigger is more overdue. */
  ageHours: number;
}

/** The order facts the rules need. Deliberately not the full row. */
export interface AttentionOrder {
  id: string;
  orderNumber: string | null;
  email: string | null;
  customerName: string | null;
  amountTotal: number;
  createdAt: string;
  stage: string;
  flagged: boolean;
  promisedDispatchDate: string | null;
  promisedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  trackingNumber: string | null;
  reviewRequestedAt: string | null;
  /** True once a purchase order has actually been sent for every supplier. */
  purchaseOrderSent: boolean;
  /** Suppliers on the order with no purchase order sent yet. */
  suppliersAwaitingOrder: string[];
  /** When the supplier was notified, if they have been. */
  supplierNotifiedAt: string | null;
  /** When a supplier confirmed, if any has. */
  supplierConfirmedAt: string | null;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Stages where the order is finished and the watchdogs should stay quiet. */
const CLOSED_STAGES = new Set(["closed", "cancelled", "refunded"]);

function hoursSince(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return (now.getTime() - then) / HOUR;
}

/**
 * Whole business days between two dates, excluding weekends.
 *
 * Used rather than calendar days because a supplier who has not replied since
 * Friday afternoon is not late on Sunday morning, and chasing them then teaches
 * the operator to ignore the alert.
 */
export function businessDaysBetween(from: Date, to: Date): number {
  if (to <= from) return 0;
  let days = 0;
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return days;
}

/**
 * How many days past a promised date we are, or `null` if it has not passed.
 *
 * Counted as whole calendar days between the promised day and today, because
 * that is how the customer describes it: "you said Monday and it is Wednesday"
 * is two days, not the thirty-six hours since Monday ended. Anything that rounds
 * that down understates the problem on the one screen meant to surface it.
 *
 * Day-granular, so a delivery promised for today is not late at midday.
 */
function daysPast(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const promised = new Date(iso);
  if (Number.isNaN(promised.getTime())) return null;
  promised.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const days = Math.round((today.getTime() - promised.getTime()) / DAY);
  return days > 0 ? days : null;
}

function who(order: AttentionOrder): string {
  return order.customerName?.trim() || order.email?.trim() || "Customer";
}

function ref(order: AttentionOrder): string {
  return order.orderNumber ?? order.id.slice(0, 8);
}

/**
 * Thresholds, in one place so they can be argued about without reading the
 * rules. Chosen to fire while there is still time to fix things quietly.
 */
export const ATTENTION_THRESHOLDS = {
  /** Paid, nothing ordered from the supplier. The worst state on the list. */
  unorderedHours: 12,
  /** Supplier notified, no confirmation. Business days, not calendar. */
  supplierSilentBusinessDays: 2,
  /** A paid order with no promised dates at all. */
  noPromisedDatesHours: 48,
  /** Delivered, and it is time to ask for a review. */
  reviewAfterDeliveryDays: 7,
} as const;

export function assessOrder(
  order: AttentionOrder,
  now: Date = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  if (CLOSED_STAGES.has(order.stage)) {
    // One exception: a flagged order stays visible even when closed, because
    // flagging it was a deliberate act by a human.
    if (!order.flagged) return items;
  }

  const ageHours = hoursSince(order.createdAt, now) ?? 0;
  const base = { orderId: order.id, orderNumber: order.orderNumber };

  // 1. Paid, and nothing ordered from the supplier. The customer's money is
  //    taken and their goods are not on order anywhere.
  if (
    !order.purchaseOrderSent &&
    !CLOSED_STAGES.has(order.stage) &&
    ageHours >= ATTENTION_THRESHOLDS.unorderedHours
  ) {
    items.push({
      ...base,
      id: `${order.id}:unordered`,
      severity: "critical",
      title: "Paid, but not ordered from the supplier",
      detail: `${ref(order)} · ${who(order)} · paid ${Math.floor(ageHours)}h ago${
        order.suppliersAwaitingOrder.length
          ? ` · ${order.suppliersAwaitingOrder.join(", ")}`
          : ""
      }`,
      consequence:
        "The customer has paid and nothing is on order. Every hour here is added to their delivery date.",
      ageHours,
    });
  }

  // 2. Supplier notified, no confirmation. The lead time the customer was given
  //    is quietly slipping.
  if (
    order.supplierNotifiedAt &&
    !order.supplierConfirmedAt &&
    !CLOSED_STAGES.has(order.stage)
  ) {
    const waited = businessDaysBetween(new Date(order.supplierNotifiedAt), now);
    if (waited >= ATTENTION_THRESHOLDS.supplierSilentBusinessDays) {
      items.push({
        ...base,
        id: `${order.id}:supplier-silent`,
        severity: "warning",
        title: "Supplier has not confirmed",
        detail: `${ref(order)} · ${who(order)} · ordered ${waited} working day${waited === 1 ? "" : "s"} ago`,
        consequence:
          "Nobody has confirmed this is being made. Chase now and the promised date still holds.",
        ageHours: waited * 24,
      });
    }
  }

  // 3. The dispatch date given to the customer has passed with no tracking.
  const dispatchLate = daysPast(order.promisedDispatchDate, now);
  if (dispatchLate !== null && !order.trackingNumber) {
    items.push({
      ...base,
      id: `${order.id}:dispatch-late`,
      severity: "critical",
      title: "Promised dispatch date has passed",
      detail: `${ref(order)} · ${who(order)} · ${dispatchLate} day${dispatchLate === 1 ? "" : "s"} over`,
      consequence:
        "The customer was given this date. Tell them before they notice it went by.",
      ageHours: dispatchLate * 24,
    });
  }

  // 4. The delivery date has passed and nobody has said whether it arrived.
  const deliveryLate = daysPast(order.promisedDeliveryDate, now);
  if (deliveryLate !== null && !order.actualDeliveryDate) {
    items.push({
      ...base,
      id: `${order.id}:delivery-late`,
      severity: "critical",
      title: "Promised delivery date has passed",
      detail: `${ref(order)} · ${who(order)} · ${deliveryLate} day${deliveryLate === 1 ? "" : "s"} over`,
      consequence:
        "Either it arrived and nobody recorded it, or it did not and nobody has told them.",
      ageHours: deliveryLate * 24,
    });
  }

  // 5. A paid order with no dates at all. The customer has nothing to expect.
  if (
    !order.promisedDispatchDate &&
    !order.promisedDeliveryDate &&
    !order.actualDeliveryDate &&
    !CLOSED_STAGES.has(order.stage) &&
    ageHours >= ATTENTION_THRESHOLDS.noPromisedDatesHours
  ) {
    items.push({
      ...base,
      id: `${order.id}:no-dates`,
      severity: "warning",
      title: "No delivery date promised yet",
      detail: `${ref(order)} · ${who(order)} · paid ${Math.floor(ageHours / 24)} days ago`,
      consequence:
        "The customer has no date to plan around, which is the most common reason people email to ask.",
      ageHours,
    });
  }

  // 6. Delivered a week ago and never asked for a review. Not a failure — the
  //    cheapest marketing there is, and it expires.
  const deliveredHours = hoursSince(order.actualDeliveryDate, now);
  if (
    deliveredHours !== null &&
    !order.reviewRequestedAt &&
    deliveredHours >= ATTENTION_THRESHOLDS.reviewAfterDeliveryDays * 24
  ) {
    items.push({
      ...base,
      id: `${order.id}:review-due`,
      severity: "due",
      title: "Review not yet requested",
      detail: `${ref(order)} · ${who(order)} · delivered ${Math.floor(deliveredHours / 24)} days ago`,
      consequence:
        "They are happiest now. Ask later and the answer is usually nothing.",
      ageHours: deliveredHours,
    });
  }

  // 7. Flagged by hand. Whatever the reason, a human decided this mattered.
  if (order.flagged) {
    items.push({
      ...base,
      id: `${order.id}:flagged`,
      severity: "warning",
      title: "Flagged for attention",
      detail: `${ref(order)} · ${who(order)}`,
      consequence: "You marked this yourself and it is still open.",
      ageHours,
    });
  }

  return items;
}

const SEVERITY_ORDER: Record<AttentionSeverity, number> = {
  critical: 0,
  warning: 1,
  due: 2,
};

/**
 * Every order's problems, worst first, then most overdue first.
 *
 * Sorted rather than grouped by order on purpose: the question this answers is
 * "what is the worst thing happening right now", not "tell me about order 12".
 */
export function assessOrders(
  orders: AttentionOrder[],
  now: Date = new Date(),
): AttentionItem[] {
  return orders
    .flatMap((order) => assessOrder(order, now))
    .sort(
      (a, b) =>
        SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
        b.ageHours - a.ageHours,
    );
}

/** Counts per severity, for a badge that says how bad it is, not just that it is. */
export function attentionCounts(items: AttentionItem[]): {
  critical: number;
  warning: number;
  due: number;
  total: number;
} {
  return {
    critical: items.filter((i) => i.severity === "critical").length,
    warning: items.filter((i) => i.severity === "warning").length,
    due: items.filter((i) => i.severity === "due").length,
    total: items.length,
  };
}
