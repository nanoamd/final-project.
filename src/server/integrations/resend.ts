import "server-only";

import { siteUrl } from "@/config/site";
import { env } from "@/env";
import { loadEmailTemplate } from "@/server/emails/load-template";
import { buildNewsletterWelcomeEmail } from "@/server/emails/newsletter-welcome";
import { renderTemplate } from "@/server/emails/template-renderer";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_FROM = "Kaiku <onboarding@resend.dev>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /**
   * Plain-text alternative. Worth passing whenever the caller has one: it is
   * what text-only clients and screen readers read, and a message with no text
   * part scores measurably worse with spam filters.
   */
  text?: string;
  replyTo?: string;
}

/**
 * Thin wrapper around Resend's REST API, shared by every transactional
 * email in the app (newsletter welcome, contact form notify/confirm).
 *
 * Fails soft — an error is logged and swallowed, never thrown, so a flaky
 * email send never turns an otherwise-successful form submission into a
 * failure for the visitor. Returns silently (feature disabled) if
 * RESEND_API_KEY isn't set.
 *
 * Note: Resend's default `onboarding@resend.dev` sender can only deliver to
 * the Resend account's own email address until a custom domain is verified
 * (Resend dashboard > Domains) — set RESEND_FROM_EMAIL to a verified
 * address once that's done.
 */
const warned = new Set<string>();

/**
 * Warn once per distinct misconfiguration, not once per send. Every gate here
 * used to be a silent `return`, which meant a site sending no email at all
 * looked identical to a site with nothing to send — five contact submissions
 * sat unread in the CMS for weeks because nothing ever said a notification had
 * been skipped. These lines are the difference between "misconfigured" and
 * "quiet".
 */
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[email] ${message}`);
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    warnOnce(
      "no-api-key",
      "RESEND_API_KEY is not set — this deployment sends no email at all. " +
        `Dropped: "${input.subject}" to ${input.to}.`,
    );
    return;
  }

  if (!env.RESEND_FROM_EMAIL) {
    warnOnce(
      "no-from",
      `RESEND_FROM_EMAIL is not set, so mail is sent as "${DEFAULT_FROM}". ` +
        "Resend's onboarding sender only delivers to the Resend account's own " +
        "address, so mail to anyone else is rejected. Verify a domain in Resend " +
        "and set RESEND_FROM_EMAIL to an address on it.",
    );
  }

  try {
    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || DEFAULT_FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Resend request failed with ${response.status}: ${await response.text()}`,
      );
    }
  } catch (err) {
    console.error(
      `sendEmail: failed to send "${input.subject}" to ${input.to}`,
      err,
    );
  }
}

/**
 * The newsletter welcome, in the order that respects who owns what.
 *
 * 1. A template Damien has written and enabled in Studio, if there is one.
 * 2. Otherwise `buildNewsletterWelcomeEmail` — the proper branded template.
 *
 * Step 2 is a fix, not a fallback: that template existed, carried the discount
 * logic and the branded layout, and **nothing called it**. Every subscriber was
 * getting an inline `<div>` of Georgia text written straight into this function,
 * with no Kaiku header, no footer and no plain-text alternative. It has been
 * dead code since it was added.
 */
export async function sendNewsletterWelcomeEmail(
  email: string,
  subscriberId: string,
): Promise<void> {
  const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe/${subscriberId}`;

  const template = await loadEmailTemplate("newsletter-welcome");
  const authored = renderTemplate({
    template,
    variables: {
      unsubscribeUrl,
      shopUrl: `${siteUrl}/shop`,
      siteUrl,
    },
  });

  const built =
    authored ??
    buildNewsletterWelcomeEmail({
      unsubscribeUrl,
      siteUrl,
      // No discount engine exists yet — see the note in newsletter-welcome.ts
      // for why printing a code here would be dishonest.
      discountCode: null,
    });

  await sendEmail({
    to: email,
    subject: built.subject,
    html: built.html,
    text: built.text,
  });
}
