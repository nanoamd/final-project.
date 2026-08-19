import "server-only";

import { emailKeyForOrderStage } from "@/lib/emails/catalogue";

import {
  absoluteUrl,
  formatEmailDate,
  formatMoney,
  type OrderEmailData,
} from "./format";
import {
  type BuiltEmail,
  button,
  detailTable,
  escapeHtml,
  eyebrow,
  heading,
  lineItemsTable,
  paragraph,
  renderEmail,
  renderText,
  smallPrint,
  spacer,
} from "./layout";

/**
 * The emails an order sends as it moves through its stages.
 *
 * Until now advancing a stage in admin told the customer nothing — the code
 * said so itself: *"Suggested-email drawer is a follow-up build, not this
 * one."* For a range where a sauna takes four to six weeks and costs £6,379,
 * silence is the single most likely cause of a support email, a chargeback, or
 * a customer who never orders again.
 *
 * **Only stages that change what the customer knows get an email.** Six of the
 * fifteen stages are internal bookkeeping — Internal Review, Supplier Notified,
 * Supplier Confirmed, Ready for Dispatch, Customer Follow-up, Closed. Emailing
 * on those would be noise, and worse, it would narrate Kaiku's supplier
 * arrangements to the customer, which is nobody's business but Kaiku's.
 *
 * `paid` is absent deliberately: the Stripe webhook already sends the order
 * confirmation the moment payment lands, and a second email saying the same
 * thing is how an inbox learns to ignore you.
 */

/** Extra order facts these emails need that `OrderEmailData` does not carry. */
export interface StageContext {
  trackingCarrier?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  promisedDispatchDate?: string | null;
  promisedDeliveryDate?: string | null;
  /** Free text from the admin — why it is delayed, what was refunded. */
  note?: string | null;
}

/**
 * Which template key, if any, a stage sends. `null` means stay quiet.
 *
 * Delegated to the shared catalogue so the Studio dropdown and this cannot
 * disagree — they did, and three emails were unreachable as a result.
 */
export function emailKeyForStage(stage: string): string | null {
  return emailKeyForOrderStage(stage);
}

/** The variables an editor can use in a Studio template for this order. */
export function stageVariables(
  order: OrderEmailData,
  context: StageContext,
): Record<string, string | null> {
  return {
    customerName: order.customerName ?? "there",
    orderNumber: order.orderNumber ?? order.orderId,
    orderTotal: formatMoney(order.amountTotal, order.currency),
    // Damien's own words about this specific order, typed on the order in
    // /admin/orders. `null` rather than "" when unwritten, so a template using
    // {{customerNote}} leaves no empty paragraph behind on the orders where he
    // had nothing to add.
    customerNote: context.note?.trim() || null,
    trackingUrl: context.trackingUrl ?? null,
    trackingNumber: context.trackingNumber ?? null,
    carrier: context.trackingCarrier ?? null,
    leadTime: null,
    shopUrl: absoluteUrl(order.siteUrl, "/shop"),
    orderStatusUrl: absoluteUrl(order.siteUrl, `/track/${order.orderId}`),
    unsubscribeUrl: null,
  };
}

const greeting = (order: OrderEmailData) =>
  `Hello ${escapeHtml(order.customerName?.split(" ")[0] ?? "there")},`;

/** Every built-in stage email ends the same way: how to see the order. */
function statusFooter(order: OrderEmailData): string {
  const url = absoluteUrl(order.siteUrl, `/track/${order.orderId}`);
  return (
    button(url, "View your order") +
    smallPrint(
      `Order reference ${escapeHtml(order.orderNumber ?? order.orderId)}. Reply to this email if anything looks wrong — it reaches a person.`,
    )
  );
}

function shell(
  order: OrderEmailData,
  {
    subject,
    preheader,
    label,
    title,
    body,
    text,
  }: {
    subject: string;
    preheader: string;
    label: string;
    title: string;
    body: string;
    text: string[];
  },
): BuiltEmail {
  return {
    subject,
    html: renderEmail({
      title: subject,
      preheader,
      content: eyebrow(label) + heading(title) + body + statusFooter(order),
    }),
    text: renderText([
      title,
      ...text,
      `View your order: ${absoluteUrl(order.siteUrl, `/track/${order.orderId}`)}`,
      `Order reference ${order.orderNumber ?? order.orderId}`,
    ]),
  };
}

/**
 * The built-in version of each stage email. A Studio template overrides any of
 * these; these are what sends until one exists, and what sends again if one is
 * ever deleted.
 */
export function buildStageEmail(
  stage: string,
  order: OrderEmailData,
  context: StageContext = {},
): BuiltEmail | null {
  const firstItem = order.items[0]?.description ?? "your order";

  switch (stage) {
    case "production":
      return shell(order, {
        subject: "Your order has gone into production",
        preheader: "It is being built now — here is what happens next.",
        label: "In production",
        title: "It's being built",
        body:
          paragraph(greeting(order)) +
          paragraph(
            `${escapeHtml(firstItem)} has gone into production. Nothing is needed from you at this stage — we will email again the moment it is ready to leave the workshop, with tracking.`,
          ) +
          (context.promisedDeliveryDate
            ? detailTable([
                {
                  label: "Estimated delivery",
                  value: escapeHtml(
                    formatEmailDate(new Date(context.promisedDeliveryDate)),
                  ),
                },
              ]) + spacer(16)
            : ""),
        text: [
          `${firstItem} has gone into production. We will email again with tracking when it is ready to ship.`,
          context.promisedDeliveryDate
            ? `Estimated delivery: ${formatEmailDate(new Date(context.promisedDeliveryDate))}`
            : "",
        ],
      });

    case "tracking": {
      const rows = [
        context.trackingCarrier
          ? { label: "Carrier", value: escapeHtml(context.trackingCarrier) }
          : null,
        context.trackingNumber
          ? {
              label: "Tracking number",
              value: escapeHtml(context.trackingNumber),
            }
          : null,
        context.promisedDeliveryDate
          ? {
              label: "Expected delivery",
              value: escapeHtml(
                formatEmailDate(new Date(context.promisedDeliveryDate)),
              ),
            }
          : null,
      ].filter((row): row is { label: string; value: string } => row !== null);

      return shell(order, {
        subject: "Your order is on its way",
        preheader: context.trackingNumber
          ? `Tracking ${context.trackingNumber}`
          : "It has left the workshop.",
        label: "Dispatched",
        title: "On its way",
        body:
          paragraph(greeting(order)) +
          paragraph(
            `${escapeHtml(firstItem)} has been dispatched. ${
              context.trackingUrl
                ? "You can follow it with the carrier using the link below."
                : "The carrier will be in touch to arrange a delivery slot."
            }`,
          ) +
          (rows.length ? detailTable(rows) + spacer(16) : "") +
          (context.trackingUrl
            ? button(context.trackingUrl, "Track with the carrier")
            : ""),
        text: [
          `${firstItem} has been dispatched.`,
          context.trackingCarrier ? `Carrier: ${context.trackingCarrier}` : "",
          context.trackingNumber
            ? `Tracking number: ${context.trackingNumber}`
            : "",
          context.trackingUrl ? `Track it: ${context.trackingUrl}` : "",
        ],
      });
    }

    case "delivered":
      return shell(order, {
        subject: "Your order has been delivered",
        preheader: "Everything as it should be?",
        label: "Delivered",
        title: "Delivered",
        body:
          paragraph(greeting(order)) +
          paragraph(
            `Our records show ${escapeHtml(firstItem)} has arrived. Please check it over — if anything is damaged or missing, reply to this email within 48 hours with a photograph and we will sort it out.`,
          ),
        text: [
          `Our records show ${firstItem} has arrived. If anything is damaged or missing, reply within 48 hours with a photograph.`,
        ],
      });

    case "review_requested":
      return shell(order, {
        subject: "How is it settling in?",
        preheader: "A minute of your time, if you have it.",
        label: "Your thoughts",
        title: "How is it settling in?",
        body:
          paragraph(greeting(order)) +
          paragraph(
            `You have had ${escapeHtml(firstItem)} a little while now. If you have a minute, we would genuinely like to know how you are finding it — reply to this email and it reaches us directly.`,
          ),
        text: [
          `If you have a minute, we would like to know how you are finding ${firstItem}. Reply to this email.`,
        ],
      });

    case "on_hold":
      return shell(order, {
        subject: "An update on your order",
        preheader: "There is a delay — here is where things stand.",
        label: "Delayed",
        title: "An update on your order",
        body:
          paragraph(greeting(order)) +
          paragraph(
            `${escapeHtml(firstItem)} is taking longer than we quoted, and we would rather tell you than let the date slide quietly.`,
          ) +
          (context.note ? paragraph(escapeHtml(context.note)) : "") +
          paragraph(
            "Your order is not cancelled and nothing is needed from you. If this delay does not work for you, reply and we will cancel and refund it in full.",
          ),
        text: [
          `${firstItem} is taking longer than quoted.`,
          context.note ?? "",
          "Nothing is needed from you. Reply if you would rather cancel and be refunded in full.",
        ],
      });

    case "cancelled":
      return shell(order, {
        subject: "Your order has been cancelled",
        preheader: "Confirmation, and what happens to your payment.",
        label: "Cancelled",
        title: "Your order has been cancelled",
        body:
          paragraph(greeting(order)) +
          paragraph(
            `${escapeHtml(firstItem)} has been cancelled${context.note ? "" : " as requested"}.`,
          ) +
          (context.note ? paragraph(escapeHtml(context.note)) : "") +
          paragraph(
            "Any payment taken is being refunded to the card you paid with. Refunds usually appear within five to ten working days, depending on your bank.",
          ) +
          lineItemsTable(
            order.items.map((item) => ({
              title: escapeHtml(item.description ?? "Item"),
              detail:
                item.quantity && item.quantity > 1
                  ? `Quantity: ${item.quantity}`
                  : "",
              amount: escapeHtml(
                formatMoney(item.amountTotal ?? 0, order.currency),
              ),
            })),
          ) +
          spacer(16),
        text: [
          `${firstItem} has been cancelled.`,
          context.note ?? "",
          "Any payment taken is being refunded to the card you paid with, usually within five to ten working days.",
        ],
      });

    case "refunded":
      return shell(order, {
        subject: "Your refund has been issued",
        preheader: "It is on its way back to your card.",
        label: "Refunded",
        title: "Your refund has been issued",
        body:
          paragraph(greeting(order)) +
          paragraph(
            `A refund has been issued against your order for ${escapeHtml(firstItem)}.`,
          ) +
          (context.note ? paragraph(escapeHtml(context.note)) : "") +
          detailTable([
            {
              label: "Refunded to",
              value: "The card you paid with",
            },
            {
              label: "Order total",
              value: escapeHtml(formatMoney(order.amountTotal, order.currency)),
              emphasis: true,
            },
          ]) +
          spacer(16) +
          paragraph(
            "Refunds usually appear within five to ten working days, depending on your bank. If it has not arrived after ten, reply to this email and we will chase it.",
          ),
        text: [
          `A refund has been issued against your order for ${firstItem}.`,
          context.note ?? "",
          `Order total: ${formatMoney(order.amountTotal, order.currency)}`,
          "Refunds usually appear within five to ten working days.",
        ],
      });

    default:
      // An internal stage. Silence is the correct behaviour, not an omission.
      return null;
  }
}
