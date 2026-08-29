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
   * A real, working discount code — or `null`, which is now the normal case.
   *
   * **The 10% welcome offer has been withdrawn.** Damien: *"the first order
   * discounts dont work when most products are at 20% margin, i dont want to
   * do this just yet unless theres a minimum spend for it"*. On a 20-point
   * margin a 10% order discount is half the gross, and it was never
   * enforceable in the first place — there is no coupon table here and
   * `allow_promotion_codes` is not set on the Stripe Checkout session, so
   * there is no field at checkout to type a code into.
   *
   * The parameter stays because the offer may come back with a minimum spend
   * attached. Bringing it back needs three things, not one: a promotion code
   * in the Stripe dashboard with a minimum order value on it,
   * `allow_promotion_codes: true` on the session in
   * `src/server/actions/checkout.ts`, and the code passed in here. Until all
   * three exist, passing a code would print something checkout rejects.
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

  // With no offer to make, the welcome gives the subscriber the thing that is
  // actually worth having and costs no margin: the tools and the guides. Both
  // are free, both are already written, and both are the reason to trust the
  // shop before spending anything in it.
  const offerHeading = code ? "Your discount" : "Where to start";
  const toolsUrl = absoluteUrl(data.siteUrl, "/tools");
  const learnUrl = absoluteUrl(data.siteUrl, "/learn");

  const offerCopyHtml = code
    ? `Enter <strong style="color:#1b1b1d;">${escapeHtml(code)}</strong> at checkout to take your discount.`
    : `Before you buy anything, use the part of the shop that is free: <a href="${toolsUrl}" style="color:#c65a2c;">twelve sizing tools</a> that work out what fits, and <a href="${learnUrl}" style="color:#c65a2c;">fourteen buying guides</a> that answer the question behind the purchase. They are the reason most of what we sell gets bought once rather than returned.`;

  const offerCopyText = code
    ? `Enter ${code} at checkout to take your discount.`
    : `Before you buy anything, use the part of the shop that is free: twelve sizing tools that work out what fits (${toolsUrl}), and fourteen buying guides that answer the question behind the purchase (${learnUrl}).`;

  const html = renderEmail({
    title: subject,
    preheader: code
      ? `Your discount code: ${code}`
      : "Twelve free tools, fourteen guides, and what to expect from us",
    content: [
      eyebrow("Newsletter"),
      heading("You're on the list."),
      paragraph(
        "Thank you for joining. A few emails a month, no more: new pieces as they land, and writing on home and garden that is worth the time it takes to read.",
      ),
      subheading(offerHeading),
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
    `${offerHeading.toUpperCase()}\n${offerCopyText}`,
    `Browse the range: ${shopUrl}`,
    `Questions are welcome. We answer by email only — write to ${siteConfig.email} and it reaches us directly.`,
    `You are receiving this because you signed up at ${siteConfig.url.replace(
      /^https?:\/\//,
      "",
    )}. Unsubscribe at any time: ${data.unsubscribeUrl}`,
  ]);

  return { subject, html, text };
}
