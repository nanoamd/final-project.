import "server-only";

import { siteConfig } from "@/config/site";

import { absoluteUrl } from "./format";
import {
  type BuiltEmail,
  button,
  escapeHtml,
  escapeHtmlWithBreaks,
  eyebrow,
  heading,
  paragraph,
  renderEmail,
  renderText,
  smallPrint,
  spacer,
  subheading,
} from "./layout";

/**
 * The two "we've got your message" emails.
 *
 * Both existed before this file, written as inline `<div>`s of Georgia serif
 * directly inside the form actions — no Kaiku header, no footer, no plain-text
 * alternative, and nothing like the rest of the site's mail. The same fault the
 * newsletter welcome had. On a quote form that is the highest-value thing this
 * site collects, the acknowledgement is the first impression of how Kaiku
 * handles a £6,000 enquiry.
 *
 * Kept in `emails/` rather than in the actions so both go through the
 * Outlook-safe layout and can be previewed at /admin/emails like everything
 * else.
 */

export interface QuoteReceivedData {
  customerName: string;
  /** The human-quotable reference shown on the confirmation screen. */
  reference: string;
  siteUrl: string;
  /** What they asked about, for reassurance that it arrived intact. */
  projectTypes?: string[];
}

export function buildQuoteReceivedEmail(data: QuoteReceivedData): BuiltEmail {
  const firstName = data.customerName.trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Thank you, ${firstName}.` : "Thank you.";
  const subject = `Your quote request — ${data.reference}`;
  const summary = (data.projectTypes ?? []).filter(Boolean).join(", ");

  const bodyHtml = [
    eyebrow("Quote request received"),
    heading(greeting),
    paragraph(
      "We have your request, and a person will read it properly rather than send you a brochure. If anything is missing we will ask before pricing it.",
    ),
    summary
      ? paragraph(
          `You asked us about <strong style="color:#1b1b1d;">${escapeHtml(summary)}</strong>.`,
        )
      : "",
    subheading("Your reference"),
    paragraph(
      `<span style="font-family:Consolas,Menlo,monospace;font-size:15px;">${escapeHtml(
        data.reference,
      )}</span>`,
    ),
    paragraph(
      "Quote us that reference in any reply and we will have your enquiry in front of us.",
    ),
    subheading("What happens next"),
    paragraph(
      "We price by hand, against the actual piece and your actual delivery address, so it takes a little longer than an instant quote and it is a number we can stand behind. Expect to hear from us within one working day.",
    ),
    spacer(8),
    button(absoluteUrl(data.siteUrl, "/shop"), "Keep looking"),
    spacer(8),
    smallPrint(
      `Reply to this email, or write to ${escapeHtml(siteConfig.email)}. We answer by email only, and we read every message ourselves.`,
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const html = renderEmail({
    title: subject,
    preheader: `Reference ${data.reference} — we will come back to you within one working day.`,
    content: bodyHtml,
  });

  const text = renderText([
    greeting,
    "We have your request, and a person will read it properly rather than send you a brochure. If anything is missing we will ask before pricing it.",
    summary ? `You asked us about: ${summary}` : null,
    `YOUR REFERENCE\n${data.reference}`,
    "Quote us that reference in any reply and we will have your enquiry in front of us.",
    "WHAT HAPPENS NEXT\nWe price by hand, against the actual piece and your actual delivery address, so it takes a little longer than an instant quote and it is a number we can stand behind. Expect to hear from us within one working day.",
    `Keep looking: ${absoluteUrl(data.siteUrl, "/shop")}`,
    `Reply to this email, or write to ${siteConfig.email}. We answer by email only, and we read every message ourselves.`,
  ]);

  return { subject, html, text };
}

export interface ContactReceivedData {
  customerName: string;
  siteUrl: string;
  /** Their own message, quoted back so they know what reached us. */
  message?: string | null;
}

export function buildContactReceivedEmail(
  data: ContactReceivedData,
): BuiltEmail {
  const firstName = data.customerName.trim().split(/\s+/)[0] || "";
  const greeting = firstName ? `Thank you, ${firstName}.` : "Thank you.";
  const subject = "We have your message";
  const quoted = data.message?.trim();

  const html = renderEmail({
    title: subject,
    preheader:
      "A person will read it and reply — usually within one working day.",
    content: [
      eyebrow("Message received"),
      heading(greeting),
      paragraph(
        "Your message has reached us and a person will read it. We usually reply within one working day, and always by email — we do not have a call centre and we would rather answer properly than quickly.",
      ),
      quoted
        ? [
            subheading("What you sent us"),
            // Their own words, escaped: this is visitor-submitted text going
            // into an HTML email.
            paragraph(
              `<span style="color:#48474a;">${escapeHtmlWithBreaks(quoted)}</span>`,
            ),
          ].join("")
        : "",
      spacer(8),
      button(absoluteUrl(data.siteUrl, "/shop"), "Browse the collection"),
      spacer(8),
      smallPrint(
        `If you need to add anything, just reply to this email — it reaches the same place. Or write to ${escapeHtml(siteConfig.email)}.`,
      ),
    ]
      .filter(Boolean)
      .join("\n"),
  });

  const text = renderText([
    greeting,
    "Your message has reached us and a person will read it. We usually reply within one working day, and always by email — we do not have a call centre and we would rather answer properly than quickly.",
    quoted ? `WHAT YOU SENT US\n${quoted}` : null,
    `Browse the collection: ${absoluteUrl(data.siteUrl, "/shop")}`,
    `If you need to add anything, just reply to this email — it reaches the same place. Or write to ${siteConfig.email}.`,
  ]);

  return { subject, html, text };
}

export interface ReturnRequestedData {
  customerName: string;
  siteUrl: string;
  /** The KR- reference, so it can be quoted straight back at us. */
  returnNumber: string;
  reason: string;
  /**
   * Written for the customer already, by `assessReturn` — the email wraps it
   * rather than re-deriving decision language of its own, so the on-screen
   * result and the email a customer forwards to someone always agree.
   */
  customerMessage: string;
  returnShippingPaidBy: "kaiku" | "customer";
}

export function buildReturnRequestedEmail(
  data: ReturnRequestedData,
): BuiltEmail {
  const firstName = data.customerName.trim().split(/\s+/)[0] || "";
  const greeting = firstName
    ? `Thank you, ${firstName}.`
    : "Thank you for letting us know.";
  const subject = `Your return — ${data.returnNumber}`;
  const readableReason = data.reason.replace(/-/g, " ");
  const shippingLine =
    data.returnShippingPaidBy === "kaiku"
      ? "We're covering the cost of getting it back to us."
      : "Return shipping is on you for this one — the message above explains why.";

  const html = renderEmail({
    title: subject,
    preheader: `Reference ${data.returnNumber} — ${data.customerMessage.slice(0, 90)}`,
    content: [
      eyebrow("Return request received"),
      heading(greeting),
      paragraph(
        `We have your return request for <strong style="color:#1b1b1d;">${escapeHtml(readableReason)}</strong>, and here's where it stands.`,
      ),
      subheading("Your reference"),
      paragraph(
        `<span style="font-family:Consolas,Menlo,monospace;font-size:15px;">${escapeHtml(
          data.returnNumber,
        )}</span>`,
      ),
      paragraph(
        "Quote us that reference in any reply and we'll have your request in front of us.",
      ),
      subheading("What happens next"),
      paragraph(escapeHtmlWithBreaks(data.customerMessage)),
      paragraph(escapeHtml(shippingLine)),
      spacer(8),
      smallPrint(
        `Reply to this email, or write to ${escapeHtml(siteConfig.email)}. We answer by email only, and we read every message ourselves.`,
      ),
    ].join("\n"),
  });

  const text = renderText([
    greeting,
    `We have your return request for ${readableReason}, and here's where it stands.`,
    `YOUR REFERENCE\n${data.returnNumber}`,
    "Quote us that reference in any reply and we'll have your request in front of us.",
    `WHAT HAPPENS NEXT\n${data.customerMessage}`,
    shippingLine,
    `Reply to this email, or write to ${siteConfig.email}. We answer by email only, and we read every message ourselves.`,
  ]);

  return { subject, html, text };
}
