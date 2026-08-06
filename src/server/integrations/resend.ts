import "server-only";

import { env } from "@/env";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_FROM = "Kaiku <onboarding@resend.dev>";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
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

export async function sendNewsletterWelcomeEmail(
  email: string,
  subscriberId: string,
): Promise<void> {
  const unsubscribeUrl = `${env.NEXT_PUBLIC_SITE_URL}/newsletter/unsubscribe/${subscriberId}`;
  await sendEmail({
    to: email,
    subject: "You're on the list",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 16px; line-height: 1.6;">Thank you for subscribing to Kaiku.</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4a4a4a;">
          We'll send considered writing on home improvement and design —
          never noise.
        </p>
        <p style="font-size: 13px; color: #9a9a9a; margin-top: 32px;">
          <a href="${unsubscribeUrl}" style="color: #9a9a9a;">Unsubscribe</a>
        </p>
      </div>
    `,
  });
}
