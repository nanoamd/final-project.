import "server-only";

import { siteConfig } from "@/config/site";
import { formatMinimum } from "@/lib/commerce/second-order-offer";

import { absoluteUrl } from "./format";
import {
  type BuiltEmail,
  button,
  escapeHtml,
  eyebrow,
  heading,
  paragraph,
  renderEmail,
  renderText,
  smallPrint,
  spacer,
  subheading,
} from "./layout";

export interface SecondOrderOfferData {
  customerName: string | null;
  /** The personal, single-use code created for this customer. */
  code: string;
  /** In minor units (pence), matching Stripe — 10000 for £100. */
  minimumPence: number;
  percentOff: number;
  /** Canonical site origin, no trailing slash. */
  siteUrl: string;
}

/**
 * The thank-you sent after a customer's first order, carrying the offer the
 * brief asked for: *"Prompt customers to create an account to receive 10% off
 * their second order... Do not make this feel aggressive. Position it as:
 * Join the Kaiku community."*
 *
 * Sent after the **order**, not after account creation, because sign-in is
 * now required to check out at all — see `checkout.ts` — so there is no
 * longer a separate moment where someone creates an account without buying.
 * The genuinely optional moment is coming back for a second order, which is
 * what this rewards.
 *
 * Separate from the order confirmation on purpose. The confirmation is the
 * receipt — total, delivery, returns, the things a worried customer rereads
 * a week later. Folding a discount pitch into it would compete with the
 * information a bank-holiday delivery delay is going to send someone back
 * to. This is a second, later email that can be entirely about the
 * relationship.
 *
 * £100 is stated plainly and early, per Damien: *"the second order discount
 * is fine, as long as its on orders over £100"* — a code that turns out to
 * need £100 of spend to work is a worse surprise hidden than shown.
 */
export function buildSecondOrderOfferEmail(
  data: SecondOrderOfferData,
): BuiltEmail {
  const firstName = data.customerName?.trim().split(/\s+/)[0] ?? "";
  const shopUrl = absoluteUrl(data.siteUrl, "/shop");
  const minimum = formatMinimum(data.minimumPence);
  const greeting = firstName
    ? `Welcome to Kaiku, ${firstName}.`
    : "Welcome to Kaiku.";
  const subject = "A little something for next time";

  const offerLine = `Use the code below on your next order of ${minimum} or more, and take ${data.percentOff}% off it.`;

  const html = renderEmail({
    title: subject,
    preheader: `${data.percentOff}% off your next order, ${minimum} minimum`,
    content: [
      eyebrow("Thank you"),
      heading(greeting),
      paragraph(
        "Your first order is with us, and we wanted to say thank you properly rather than just process a payment. This is the start of what we hope is a longer relationship, not a one-off transaction.",
      ),
      subheading("Your code, for next time"),
      paragraph(offerLine),
      spacer(4),
      paragraph(
        `<span style="font-family:Consolas,Menlo,monospace;font-size:18px;letter-spacing:1px;background:#f4f2ed;padding:8px 14px;border-radius:6px;display:inline-block;">${escapeHtml(
          data.code,
        )}</span>`,
      ),
      spacer(8),
      button(shopUrl, "Browse the range"),
      paragraph(
        "No rush — the code has no expiry. It's here whenever you're ready to come back.",
      ),
      spacer(8),
      smallPrint(
        `Questions are welcome. Write to <a href="mailto:${siteConfig.email}" style="color:#c65a2c;">${siteConfig.email}</a> and it reaches us directly.`,
      ),
    ].join("\n"),
  });

  const text = renderText([
    greeting,
    "Your first order is with us, and we wanted to say thank you properly rather than just process a payment. This is the start of what we hope is a longer relationship, not a one-off transaction.",
    `YOUR CODE, FOR NEXT TIME\n${offerLine}\n\n${data.code}`,
    `Browse the range: ${shopUrl}`,
    "No rush — the code has no expiry. It's here whenever you're ready to come back.",
    `Questions are welcome. Write to ${siteConfig.email} and it reaches us directly.`,
  ]);

  return { subject, html, text };
}
