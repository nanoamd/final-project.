import "server-only";

import { siteConfig } from "@/config/site";

import {
  absoluteUrl,
  describeLeadTime,
  type EmailLineItem,
  formatAddressLines,
  formatEmailDate,
  formatLineDetail,
  formatMoney,
  type OrderEmailData,
  sharedLeadTime,
} from "./format";
import {
  type BuiltEmail,
  detailTable,
  divider,
  escapeHtml,
  eyebrow,
  heading,
  lineItemsTable,
  paragraph,
  renderEmail,
  renderText,
  smallPrint,
  spacer,
  subheading,
} from "./layout";

/**
 * The customer's order confirmation — the one email on this site that has to
 * exist. Before it, a shopper spent four figures on a sauna and received
 * nothing but a Stripe receipt with no order reference, no delivery window and
 * no way to ask a question.
 *
 * Every fact in it comes from the order itself. Lead times are the product's
 * own `deliveryLeadTime` reproduced verbatim, and an item with no recorded lead
 * time says so rather than borrowing a number from its neighbour.
 */
export function buildOrderConfirmationEmail(order: OrderEmailData): BuiltEmail {
  const trackUrl = absoluteUrl(order.siteUrl, `/track/${order.orderId}`);
  const returnsUrl = absoluteUrl(order.siteUrl, "/returns");
  const total = formatMoney(order.amountTotal, order.currency);
  const shared = sharedLeadTime(order.items);
  const anyUnknownLeadTime = order.items.some((item) => !item.leadTime?.trim());
  const addressLines = formatAddressLines(order.shippingAddress);
  const firstName = order.customerName?.trim().split(/\s+/)[0] ?? "";

  const greeting = firstName
    ? `Thank you, ${firstName}.`
    : "Thank you for your order.";

  const preheader = shared
    ? `${total} · delivered in ${shared}`
    : `${total} · your order reference and delivery details are inside`;

  const itemRows = order.items.map((item) => {
    const detail = [
      ...formatLineDetail(item),
      describeLeadTime(item.leadTime),
    ].map(escapeHtml);
    return {
      title: escapeHtml(item.description?.trim() || "Item"),
      detail: detail.join(" &middot; "),
      amount:
        typeof item.amountTotal === "number"
          ? escapeHtml(formatMoney(item.amountTotal, order.currency))
          : undefined,
    };
  });

  const html = renderEmail({
    title: "Your Kaiku order is confirmed",
    preheader,
    content: [
      eyebrow("Order confirmed"),
      heading(greeting),
      paragraph(
        "Your payment has gone through and the order is with us. Here is what you bought.",
      ),
      spacer(8),
      lineItemsTable([
        ...itemRows,
        {
          title: `<span style="font-size:14px;">Delivery</span>`,
          detail: "Free, UK mainland",
          amount: escapeHtml(formatMoney(0, order.currency)),
        },
      ]),
      spacer(4),
      detailTable([
        { label: "Total paid", value: escapeHtml(total), emphasis: true },
      ]),
      subheading("Delivery"),
      paragraph(
        shared
          ? `${escapeHtml(describeLeadTime(shared))}. Delivery is free across the UK mainland and is included in the price you have paid.`
          : "Delivery is free across the UK mainland and is included in the price you have paid. Each piece carries its own lead time, shown against it above.",
      ),
      paragraph(
        anyUnknownLeadTime
          ? "Where no lead time is shown above, we will confirm it by email once the piece is booked with the maker. We will email you to arrange a delivery date."
          : "We will email you to arrange a delivery date.",
      ),
      addressLines.length > 0
        ? [
            subheading("Delivering to"),
            paragraph(
              addressLines.map((line) => escapeHtml(line)).join("<br />"),
            ),
          ].join("")
        : "",
      subheading("Your order reference"),
      // The human number when there is one, so a customer can read it back
      // over the phone. Older orders (pre-migration 0005) still show the UUID
      // rather than nothing.
      paragraph(
        `<span style="font-family:Consolas,Menlo,monospace;font-size:15px;word-break:break-all;">${escapeHtml(
          order.orderNumber ?? order.orderId,
        )}</span>`,
      ),
      paragraph(
        `You can check the status of the order at any time at <a href="${escapeHtml(
          trackUrl,
        )}" style="color:#c65a2c;">${escapeHtml(trackUrl)}</a>. No account or password is needed.`,
      ),
      subheading("Changing your mind"),
      paragraph(
        `You have 14 days from delivery to return an unused item in its original packaging for a full refund. Made-to-order and bespoke pieces are non-returnable unless faulty — email us and we will confirm where your order stands. Full terms: <a href="${escapeHtml(
          returnsUrl,
        )}" style="color:#c65a2c;">${escapeHtml(returnsUrl)}</a>.`,
      ),
      subheading("If you need us"),
      paragraph(
        `Reply to this email, or write to <a href="mailto:${siteConfig.email}" style="color:#c65a2c;">${siteConfig.email}</a>. We answer by email only, and we read every message ourselves. Quote the reference above and we will have the order in front of us.`,
      ),
      spacer(8),
      divider(),
      spacer(12),
      smallPrint(
        `Order placed ${escapeHtml(formatEmailDate(order.placedAt))}. This is a receipt for a purchase from ${escapeHtml(
          siteConfig.legalName,
        )}.`,
      ),
    ].join("\n"),
  });

  const text = renderText([
    greeting,
    "Your payment has gone through and the order is with us. Here is what you bought.",
    order.items.map((item) => textLine(item, order.currency)).join("\n"),
    `Delivery: free, UK mainland — ${formatMoney(0, order.currency)}`,
    `Total paid: ${total}`,
    "DELIVERY",
    shared
      ? `${describeLeadTime(shared)}. Delivery is free across the UK mainland and is included in the price you have paid.`
      : "Delivery is free across the UK mainland and is included in the price you have paid. Each piece carries its own lead time, shown against it above.",
    anyUnknownLeadTime
      ? "Where no lead time is shown above, we will confirm it by email once the piece is booked with the maker. We will email you to arrange a delivery date."
      : "We will email you to arrange a delivery date.",
    addressLines.length > 0
      ? `DELIVERING TO\n${addressLines.join("\n")}`
      : null,
    `YOUR ORDER REFERENCE\n${order.orderNumber ?? order.orderId}`,
    `Check the status of your order at any time: ${trackUrl}`,
    `CHANGING YOUR MIND\nYou have 14 days from delivery to return an unused item in its original packaging for a full refund. Made-to-order and bespoke pieces are non-returnable unless faulty — email us and we will confirm where your order stands. Full terms: ${returnsUrl}`,
    `IF YOU NEED US\nReply to this email, or write to ${siteConfig.email}. We answer by email only, and we read every message ourselves. Quote the reference above and we will have the order in front of us.`,
    `Order placed ${formatEmailDate(order.placedAt)}. This is a receipt for a purchase from ${siteConfig.legalName}.`,
  ]);

  return { subject: "Your Kaiku order is confirmed", html, text };
}

function textLine(item: EmailLineItem, currency: string): string {
  const amount =
    typeof item.amountTotal === "number"
      ? ` — ${formatMoney(item.amountTotal, currency)}`
      : "";
  const detail = [...formatLineDetail(item), describeLeadTime(item.leadTime)];
  return `- ${item.description?.trim() || "Item"}${amount}\n  ${detail.join(" · ")}`;
}
