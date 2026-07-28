import "server-only";

import { env } from "@/env";

const RESEND_API = "https://api.resend.com/emails";
const DEFAULT_FROM = "Kaiku <onboarding@resend.dev>";

/**
 * Sends the newsletter welcome/confirmation email via Resend's REST API.
 *
 * Fails soft — an error is logged and swallowed, never thrown, so a flaky
 * email send never turns an otherwise-successful subscribe into a failure
 * for the visitor. Returns silently (feature disabled) if RESEND_API_KEY
 * isn't set.
 *
 * Note: Resend's default `onboarding@resend.dev` sender can only deliver to
 * the Resend account's own email address until a custom domain is verified
 * (Resend dashboard > Domains) — set RESEND_FROM_EMAIL to a verified
 * address once that's done.
 */
export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) return;

  try {
    const response = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || DEFAULT_FROM,
        to: email,
        subject: "You're on the list",
        html: `
          <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
            <p style="font-size: 16px; line-height: 1.6;">Thank you for subscribing to Kaiku.</p>
            <p style="font-size: 15px; line-height: 1.6; color: #4a4a4a;">
              We'll send considered writing on home improvement and design —
              never noise, and you can unsubscribe at any time.
            </p>
          </div>
        `,
      }),
    });
    if (!response.ok) {
      throw new Error(
        `Resend request failed with ${response.status}: ${await response.text()}`,
      );
    }
  } catch (err) {
    console.error("sendNewsletterWelcomeEmail: failed", err);
  }
}
