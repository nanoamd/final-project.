import "server-only";

import {
  absoluteUrl,
  describeLeadTime,
  type EmailLineItem,
  formatAddressLines,
  formatEmailDateTime,
  formatLineDetail,
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
  subheading,
} from "./layout";

/**
 * The owner's alert: a sale happened, here is everything needed to act on it.
 *
 * Written to be readable on a phone lock screen and complete enough to place
 * the trade order without opening the site — supplier, SKU and the product slug
 * are carried through from the Stripe line-item metadata for exactly that. The
 * point is that nobody has to watch a dashboard for a sale to be noticed.
 *
 * Sent with the customer's address as reply-to, so replying goes to them.
 */
export function buildOrderAlertEmail(order: OrderEmailData): BuiltEmail {
  const total = formatMoney(order.amountTotal, order.currency);
  const customer = order.customerName?.trim() || order.customerEmail;
  const adminUrl = absoluteUrl(order.siteUrl, `/admin/orders/${order.orderId}`);
  const addressLines = formatAddressLines(order.shippingAddress);
  const subject = order.customerName?.trim()
    ? `New order — ${total} · ${order.customerName.trim()}`
    : `New order — ${total}`;

  const itemRows = order.items.map((item) => ({
    title: escapeHtml(item.description?.trim() || "Item"),
    detail: itemMeta(item).map(escapeHtml).join(" &middot; "),
    amount:
      typeof item.amountTotal === "number"
        ? escapeHtml(formatMoney(item.amountTotal, order.currency))
        : undefined,
  }));

  const html = renderEmail({
    title: subject,
    preheader: `${total} from ${customer}`,
    content: [
      eyebrow("New order"),
      heading(total),
      paragraph(
        `Paid ${escapeHtml(formatEmailDateTime(order.placedAt))} by ${escapeHtml(customer)}.`,
      ),
      button(adminUrl, "Open in Kaiku HQ"),
      subheading("What was bought"),
      lineItemsTable(itemRows),
      subheading("Customer"),
      detailTable([
        {
          label: "Name",
          value: escapeHtml(order.customerName?.trim() || "—"),
        },
        {
          label: "Email",
          value: `<a href="mailto:${escapeHtml(order.customerEmail)}" style="color:#c65a2c;">${escapeHtml(
            order.customerEmail,
          )}</a>`,
        },
        {
          label: "Phone",
          value: escapeHtml(order.customerPhone?.trim() || "—"),
        },
        {
          label: "Delivery address",
          value:
            addressLines.length > 0
              ? addressLines.map((line) => escapeHtml(line)).join("<br />")
              : "—",
        },
        {
          label: "Order reference",
          value: `<span style="font-family:Consolas,Menlo,monospace;word-break:break-all;">${escapeHtml(
            order.orderId,
          )}</span>`,
        },
        { label: "Total paid", value: escapeHtml(total), emphasis: true },
      ]),
      paragraph("Replying to this email replies to the customer."),
    ].join("\n"),
  });

  const text = renderText([
    `NEW ORDER — ${total}`,
    `Paid ${formatEmailDateTime(order.placedAt)} by ${customer}.`,
    `Open in Kaiku HQ: ${adminUrl}`,
    `WHAT WAS BOUGHT\n${order.items
      .map((item) => textLine(item, order.currency))
      .join("\n")}`,
    [
      "CUSTOMER",
      `Name: ${order.customerName?.trim() || "—"}`,
      `Email: ${order.customerEmail}`,
      `Phone: ${order.customerPhone?.trim() || "—"}`,
      `Delivery address: ${addressLines.length > 0 ? addressLines.join(", ") : "—"}`,
      `Order reference: ${order.orderId}`,
      `Total paid: ${total}`,
    ].join("\n"),
    "Replying to this email replies to the customer.",
  ]);

  return { subject, html, text };
}

/** Fulfilment metadata: quantity, options, lead time, supplier, SKU, slug. */
function itemMeta(item: EmailLineItem): string[] {
  const meta = [...formatLineDetail(item), describeLeadTime(item.leadTime)];
  if (item.supplier) meta.push(`Supplier: ${item.supplier}`);
  if (item.sku) meta.push(`SKU: ${item.sku}`);
  if (item.slug) meta.push(`/${item.slug}`);
  return meta;
}

function textLine(item: EmailLineItem, currency: string): string {
  const amount =
    typeof item.amountTotal === "number"
      ? ` — ${formatMoney(item.amountTotal, currency)}`
      : "";
  return `- ${item.description?.trim() || "Item"}${amount}\n  ${itemMeta(item).join(" · ")}`;
}
