import "server-only";

import { siteConfig } from "@/config/site";

import {
  type EmailAddress,
  formatAddressLines,
  formatEmailDate,
} from "../emails/format";
import {
  type BuiltEmail,
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
  subheading,
} from "../emails/layout";

/**
 * The purchase order Kaiku sends a dropship supplier once a customer has paid.
 *
 * "one place to track all orders easily then quickly order it by pressing a
 * link" — this is the second half of that. Placing the order with the supplier
 * is the one step in the whole chain that was still done by hand, from memory,
 * per order.
 *
 * **Three decisions worth stating, because each is a way to lose money:**
 *
 * 1. **No prices.** Not the retail price, not the recorded trade cost. The
 *    supplier invoices at their own trade price from their own system; quoting
 *    Kaiku's retail price hands them the margin, and quoting a trade cost that
 *    has drifted since import invites a dispute over the invoice. A dropship
 *    order needs four things: what, how many, where, and who to call.
 * 2. **The supplier's own SKU leads.** Their warehouse cannot pick a Kaiku code.
 *    Kaiku's SKU follows as a cross-reference so a reply can be matched back.
 * 3. **The customer's phone, never the customer's email.** Delivery and
 *    installation booking genuinely needs a phone call (which is why checkout
 *    collects one). The email address is Kaiku's relationship with its customer
 *    and is not the supplier's to use.
 */

export interface PurchaseOrderItem {
  /** Product title as charged, so a human can sanity-check the SKU. */
  title: string;
  /** The supplier's own code — what their warehouse picks by. */
  supplierSku: string | null;
  /** Kaiku's code, as a cross-reference. */
  kaikuSku: string | null;
  quantity: number;
  /** Chosen variant options — colour, size, heater type. */
  options: Record<string, string> | null;
}

export interface PurchaseOrderInput {
  supplierName: string;
  /** Who at the supplier this is addressed to, when known. */
  contactName: string | null;
  /** The Kaiku order number, used as the PO reference. */
  orderNumber: string;
  placedAt: Date;
  items: PurchaseOrderItem[];
  deliveryAddress: EmailAddress | null;
  customerName: string | null;
  customerPhone: string | null;
}

/** True when the order cannot actually be placed as it stands. */
export interface PurchaseOrderProblem {
  kind: "missing-supplier-sku" | "missing-address" | "missing-phone";
  detail: string;
}

/**
 * What is wrong with this order, before it is sent.
 *
 * Surfaced rather than papered over: a purchase order missing the supplier's SKU
 * or the delivery address will bounce back as a query, and a query costs a day.
 * Better to see it in the draft than to find out from the supplier.
 */
export function purchaseOrderProblems(
  input: PurchaseOrderInput,
): PurchaseOrderProblem[] {
  const problems: PurchaseOrderProblem[] = [];

  for (const item of input.items) {
    if (!item.supplierSku?.trim()) {
      problems.push({
        kind: "missing-supplier-sku",
        detail: `"${item.title}" has no supplier SKU recorded. Add it to the product in Studio, or write the code into the email before sending.`,
      });
    }
  }

  if (formatAddressLines(input.deliveryAddress).length === 0) {
    problems.push({
      kind: "missing-address",
      detail:
        "No delivery address on this order. The supplier cannot dispatch without one.",
    });
  }

  if (!input.customerPhone?.trim()) {
    problems.push({
      kind: "missing-phone",
      detail:
        "No customer phone number. Most dropship carriers will not book a delivery slot without one.",
    });
  }

  return problems;
}

function optionsLine(options: Record<string, string> | null): string | null {
  if (!options) return null;
  const entries = Object.entries(options).filter(
    ([, value]) => typeof value === "string" && value.trim(),
  );
  if (!entries.length) return null;
  return entries.map(([key, value]) => `${key}: ${value}`).join(" · ");
}

/** The reference a supplier quotes back. Kept identical to the order number. */
function poReference(orderNumber: string): string {
  return orderNumber;
}

export function buildPurchaseOrderEmail(input: PurchaseOrderInput): BuiltEmail {
  const reference = poReference(input.orderNumber);
  const subject = `Purchase order ${reference} — ${siteConfig.name}`;
  const addressLines = formatAddressLines(input.deliveryAddress);
  const greeting = input.contactName?.trim()
    ? `Hello ${input.contactName.trim()},`
    : `Hello ${input.supplierName},`;

  const itemRows = input.items.map((item) => {
    const detail = [
      // The supplier's code first — it is the only one their system knows.
      item.supplierSku?.trim()
        ? `Your ref: ${item.supplierSku.trim()}`
        : "Your ref: NOT RECORDED — please confirm the correct code",
      item.kaikuSku?.trim() ? `Our ref: ${item.kaikuSku.trim()}` : null,
      optionsLine(item.options),
    ]
      .filter(Boolean)
      .map((part) => escapeHtml(String(part)));

    return {
      title: escapeHtml(item.title),
      detail: detail.join(" &middot; "),
      // Quantity in the amount column rather than a price. See the note above.
      amount: escapeHtml(`Qty ${item.quantity}`),
    };
  });

  const html = renderEmail({
    title: subject,
    preheader: `Purchase order ${reference} — ${input.items.length} line${
      input.items.length === 1 ? "" : "s"
    } for dropship delivery.`,
    content: [
      eyebrow("Purchase order"),
      heading(`Order ${escapeHtml(reference)}`),
      paragraph(escapeHtml(greeting)),
      paragraph(
        "Please supply the following for dropship delivery direct to our customer. Invoice us at your usual trade terms.",
      ),
      spacer(8),
      lineItemsTable(itemRows),
      spacer(4),
      subheading("Deliver to"),
      addressLines.length > 0
        ? paragraph(addressLines.map((line) => escapeHtml(line)).join("<br />"))
        : paragraph(
            "<strong>No delivery address recorded — we will send this separately before you dispatch.</strong>",
          ),
      input.customerPhone?.trim()
        ? paragraph(
            `Contact for delivery booking: ${escapeHtml(
              input.customerName?.trim() || "the recipient",
            )}, ${escapeHtml(input.customerPhone.trim())}`,
          )
        : paragraph(
            "<strong>No contact number recorded</strong> — please tell us if you need one to book the delivery.",
          ),
      subheading("Reference"),
      detailTable([
        { label: "Our order number", value: escapeHtml(reference) },
        {
          label: "Ordered",
          value: escapeHtml(formatEmailDate(input.placedAt)),
        },
      ]),
      paragraph(
        `Please confirm receipt, the dispatch date, and the tracking details when available, quoting ${escapeHtml(
          reference,
        )}. Replying to this email reaches us directly.`,
      ),
      spacer(8),
      smallPrint(
        `Sent by ${escapeHtml(siteConfig.legalName)}. Please raise any query on this order by email rather than contacting the recipient directly.`,
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const text = renderText([
    `PURCHASE ORDER ${reference}`,
    greeting,
    "Please supply the following for dropship delivery direct to our customer. Invoice us at your usual trade terms.",
    input.items
      .map((item) => {
        const detail = [
          item.supplierSku?.trim()
            ? `Your ref: ${item.supplierSku.trim()}`
            : "Your ref: NOT RECORDED — please confirm the correct code",
          item.kaikuSku?.trim() ? `Our ref: ${item.kaikuSku.trim()}` : null,
          optionsLine(item.options),
        ]
          .filter(Boolean)
          .join(" · ");
        return `- ${item.title} — Qty ${item.quantity}\n  ${detail}`;
      })
      .join("\n"),
    addressLines.length > 0
      ? `DELIVER TO\n${addressLines.join("\n")}`
      : "DELIVER TO\nNo delivery address recorded — we will send this separately before you dispatch.",
    input.customerPhone?.trim()
      ? `Contact for delivery booking: ${input.customerName?.trim() || "the recipient"}, ${input.customerPhone.trim()}`
      : "No contact number recorded — please tell us if you need one to book the delivery.",
    `REFERENCE\nOur order number: ${reference}\nOrdered: ${formatEmailDate(input.placedAt)}`,
    `Please confirm receipt, the dispatch date, and the tracking details when available, quoting ${reference}. Replying to this email reaches us directly.`,
    `Sent by ${siteConfig.legalName}. Please raise any query on this order by email rather than contacting the recipient directly.`,
  ]);

  return { subject, html, text };
}
