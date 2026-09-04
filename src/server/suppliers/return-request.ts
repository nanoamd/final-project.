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
 * The return request Kaiku sends a dropship supplier once a customer's
 * return has been assessed — the half of "the admin returns screen" that
 * turned out still to be missing when the screen itself was checked and
 * found already built.
 *
 * Same three decisions as the purchase order this deliberately mirrors, for
 * the same reasons: no prices (the supplier's own trade terms govern any
 * credit note), the supplier's own SKU leads, and the customer's phone
 * rather than their email goes to the supplier — it is Kaiku's relationship
 * to hand over, not theirs to use directly.
 *
 * What a purchase order doesn't need and this does: the reason, whether
 * Kaiku or the customer is paying return shipping (so the supplier isn't
 * asked to arrange a collection Kaiku isn't covering), and any photo
 * evidence the customer supplied — a fault claim's whole point is showing
 * the supplier what's wrong, not just naming the item.
 */

export interface ReturnRequestItem {
  title: string;
  supplierSku: string | null;
  kaikuSku: string | null;
  quantity: number;
  options: Record<string, string> | null;
}

export interface SupplierReturnRequestInput {
  supplierName: string;
  contactName: string | null;
  /** The KR- reference, and the Kaiku order number as cross-reference. */
  returnNumber: string;
  orderNumber: string;
  requestedAt: Date;
  reason: string;
  /** The customer's own description of the fault, where they gave one. */
  customerDetail: string | null;
  items: ReturnRequestItem[];
  returnShippingPaidBy: "kaiku" | "customer";
  /** Sanity-hosted photo URLs, evidence of a fault or transit damage. */
  photoUrls: string[];
  collectionAddress: EmailAddress | null;
  customerName: string | null;
  customerPhone: string | null;
}

/** True when the request cannot actually be sent as it stands. */
export interface ReturnRequestProblem {
  kind: "missing-supplier-sku" | "missing-address";
  detail: string;
}

export function returnRequestProblems(
  input: SupplierReturnRequestInput,
): ReturnRequestProblem[] {
  const problems: ReturnRequestProblem[] = [];

  for (const item of input.items) {
    if (!item.supplierSku?.trim()) {
      problems.push({
        kind: "missing-supplier-sku",
        detail: `"${item.title}" has no supplier SKU recorded. Add it to the product in Studio, or write the code into the email before sending.`,
      });
    }
  }

  if (
    input.returnShippingPaidBy === "kaiku" &&
    formatAddressLines(input.collectionAddress).length === 0
  ) {
    problems.push({
      kind: "missing-address",
      detail:
        "No address on this order for the supplier to collect from. Confirm it with the customer before sending.",
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

export function buildSupplierReturnRequestEmail(
  input: SupplierReturnRequestInput,
): BuiltEmail {
  const subject = `Return request ${input.returnNumber} — ${siteConfig.name}`;
  const addressLines = formatAddressLines(input.collectionAddress);
  const greeting = input.contactName?.trim()
    ? `Hello ${input.contactName.trim()},`
    : `Hello ${input.supplierName},`;
  const readableReason = input.reason.replace(/-/g, " ");

  const itemRows = input.items.map((item) => {
    const detail = [
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
      amount: escapeHtml(`Qty ${item.quantity}`),
    };
  });

  const shippingLine =
    input.returnShippingPaidBy === "kaiku"
      ? "We are covering return shipping — please arrange collection, or send a prepaid label and we will get it booked."
      : "The customer is arranging and paying for return shipping on this one.";

  const photosSection =
    input.photoUrls.length > 0
      ? [
          subheading("Photos supplied by the customer"),
          paragraph(
            input.photoUrls
              .map(
                (url, i) =>
                  `<a href="${escapeHtml(url)}" style="color:#a5471f;">Photo ${i + 1}</a>`,
              )
              .join(" &middot; "),
          ),
        ].join("\n")
      : "";

  const html = renderEmail({
    title: subject,
    preheader: `Return request ${input.returnNumber} — ${readableReason}, order ${input.orderNumber}.`,
    content: [
      eyebrow("Return request"),
      heading(`Return ${escapeHtml(input.returnNumber)}`),
      paragraph(escapeHtml(greeting)),
      paragraph(
        `A customer has asked to return the following, reason given as <strong style="color:#1b1b1d;">${escapeHtml(readableReason)}</strong>.`,
      ),
      input.customerDetail?.trim()
        ? paragraph(
            `<span style="color:#48474a;">"${escapeHtml(input.customerDetail.trim())}"</span>`,
          )
        : "",
      spacer(8),
      lineItemsTable(itemRows),
      photosSection,
      spacer(4),
      subheading("Return shipping"),
      paragraph(escapeHtml(shippingLine)),
      input.returnShippingPaidBy === "kaiku" ? subheading("Collect from") : "",
      input.returnShippingPaidBy === "kaiku"
        ? addressLines.length > 0
          ? paragraph(
              addressLines.map((line) => escapeHtml(line)).join("<br />"),
            )
          : paragraph(
              "<strong>No address recorded — we will confirm this separately.</strong>",
            )
        : "",
      input.returnShippingPaidBy === "kaiku" && input.customerPhone?.trim()
        ? paragraph(
            `Contact for collection: ${escapeHtml(
              input.customerName?.trim() || "the customer",
            )}, ${escapeHtml(input.customerPhone.trim())}`,
          )
        : "",
      subheading("Reference"),
      detailTable([
        { label: "Return reference", value: escapeHtml(input.returnNumber) },
        { label: "Our order number", value: escapeHtml(input.orderNumber) },
        {
          label: "Requested",
          value: escapeHtml(formatEmailDate(input.requestedAt)),
        },
      ]),
      paragraph(
        `Please confirm your RMA number or return instructions, quoting ${escapeHtml(
          input.returnNumber,
        )}. Replying to this email reaches us directly.`,
      ),
      spacer(8),
      smallPrint(
        `Sent by ${escapeHtml(siteConfig.legalName)}. Please raise any query on this return by email rather than contacting the customer directly.`,
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const text = renderText([
    `RETURN REQUEST ${input.returnNumber}`,
    greeting,
    `A customer has asked to return the following, reason given as ${readableReason}.`,
    input.customerDetail?.trim() ? `"${input.customerDetail.trim()}"` : null,
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
    input.photoUrls.length > 0 ? `PHOTOS\n${input.photoUrls.join("\n")}` : null,
    `RETURN SHIPPING\n${shippingLine}`,
    input.returnShippingPaidBy === "kaiku"
      ? addressLines.length > 0
        ? `COLLECT FROM\n${addressLines.join("\n")}`
        : "COLLECT FROM\nNo address recorded — we will confirm this separately."
      : null,
    input.returnShippingPaidBy === "kaiku" && input.customerPhone?.trim()
      ? `Contact for collection: ${input.customerName?.trim() || "the customer"}, ${input.customerPhone.trim()}`
      : null,
    `REFERENCE\nReturn reference: ${input.returnNumber}\nOur order number: ${input.orderNumber}\nRequested: ${formatEmailDate(input.requestedAt)}`,
    `Please confirm your RMA number or return instructions, quoting ${input.returnNumber}. Replying to this email reaches us directly.`,
    `Sent by ${siteConfig.legalName}. Please raise any query on this return by email rather than contacting the customer directly.`,
  ]);

  return { subject, html, text };
}
