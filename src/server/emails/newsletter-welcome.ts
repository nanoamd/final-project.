import "server-only";

import { siteConfig } from "@/config/site";

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

export interface NewsletterWelcomeData {
  /** Per-subscriber unsubscribe link, keyed by the Sanity document id. */
  unsubscribeUrl: string;
  /** Canonical site origin, no trailing slash. */
  siteUrl: string;
  /**
   * A real, working discount code — or `null`.
   *
   * The site's promo banner promises "10% OFF your first order" for joining the
   * list, and there is no discount engine in this codebase: no coupon table, no
   * `allow_promotion_codes` on the Stripe Checkout session, nothing to validate
   * a code against. Rather than print a code that would be rejected at
   * checkout, the copy below stays honest and routes the customer to email.
   *
   * To switch it on, the owner creates a promotion code in the Stripe dashboard
   * and enables promotion codes on the checkout session — then this argument
   * carries the code. See docs/email-setup.md, "The 10% off promise".
   */
  discountCode?: string | null;
}

/**
 * The newsletter welcome. Its real job is to make the sign-up promise land:
 * somebody handed over an email address on the strength of a stated offer, and
 * an empty thank-you is how that promise quietly evaporates.
 */
export function buildNewsletterWelcomeEmail(
  data: NewsletterWelcomeData,
): BuiltEmail {
  const shopUrl = absoluteUrl(data.siteUrl, "/shop");
  const code = data.discountCode?.trim() || null;
  const subject = "You're on the list";

  const offerCopyHtml = code
    ? `Enter <strong style="color:#1b1b1d;">${escapeHtml(code)}</strong> at checkout to take 10% off your first order.`
    : `We promised 10% off your first order for joining, and we will honour it. There is no code to enter at checkout yet, so email <a href="mailto:${siteConfig.email}" style="color:#c65a2c;">${siteConfig.email}</a> before you order and we will arrange it with you directly.`;

  const offerCopyText = code
    ? `Enter ${code} at checkout to take 10% off your first order.`
    : `We promised 10% off your first order for joining, and we will honour it. There is no code to enter at checkout yet, so email ${siteConfig.email} before you order and we will arrange it with you directly.`;

  const html = renderEmail({
    title: subject,
    preheader: code
      ? `Your 10% off code: ${code}`
      : "About your 10% off, and what to expect from us",
    content: [
      eyebrow("Newsletter"),
      heading("You're on the list."),
      paragraph(
        "Thank you for joining. A few emails a month, no more: new pieces as they land, and writing on home and garden that is worth the time it takes to read.",
      ),
      subheading("Your 10% off"),
      paragraph(offerCopyHtml),
      spacer(4),
      button(shopUrl, "Browse the range"),
      paragraph(
        `Questions are welcome. We answer by email only — write to <a href="mailto:${siteConfig.email}" style="color:#c65a2c;">${siteConfig.email}</a> and it reaches us directly.`,
      ),
      spacer(8),
      smallPrint(
        `You are receiving this because you signed up at ${escapeHtml(
          siteConfig.url.replace(/^https?:\/\//, ""),
        )}. <a href="${escapeHtml(data.unsubscribeUrl)}" style="color:#6b6a67;">Unsubscribe</a> at any time.`,
      ),
    ].join("\n"),
  });

  const text = renderText([
    "You're on the list.",
    "Thank you for joining. A few emails a month, no more: new pieces as they land, and writing on home and garden that is worth the time it takes to read.",
    `YOUR 10% OFF\n${offerCopyText}`,
    `Browse the range: ${shopUrl}`,
    `Questions are welcome. We answer by email only — write to ${siteConfig.email} and it reaches us directly.`,
    `You are receiving this because you signed up at ${siteConfig.url.replace(
      /^https?:\/\//,
      "",
    )}. Unsubscribe at any time: ${data.unsubscribeUrl}`,
  ]);

  return { subject, html, text };
}
