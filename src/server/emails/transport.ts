import "server-only";

import { env } from "@/env";

import type { BuiltEmail } from "./layout";

/**
 * The single outbound path for every transactional email, via Resend's REST
 * API. No SDK: one `fetch` is easier to reason about, easier to stub in a test,
 * and cannot drag a dependency's own retry/throw behaviour into a webhook.
 *
 * ## Fail-soft is the whole contract
 *
 * `sendEmail` NEVER throws and NEVER rejects. That is not defensive tidiness —
 * it is the difference between a shop and a liability. The order-confirmation
 * send happens after Stripe has already taken the customer's money; if a Resend
 * outage propagated an error out of here, the Stripe webhook would answer 500,
 * Stripe would retry it for three days, and the shop would look broken over a
 * card that was charged successfully. The same reasoning applies to the contact
 * form: the enquiry is already saved, so an email hiccup must not show the
 * visitor an error and invite them to submit it again.
 *
 * Everything that can go wrong is therefore caught and logged here:
 *
 * - `RESEND_API_KEY` unset (the current state of this deployment)
 * - DNS/TLS/connection failures
 * - a non-2xx response from Resend
 * - a request that never completes — bounded by `REQUEST_TIMEOUT_MS`, because
 *   "hangs forever" is the one failure a try/catch alone does not cover
 *
 * Failures are logged loudly. A dropped email must be visible in the platform
 * logs, or "we send no email at all" looks exactly like "there was nothing to
 * send".
 */

const RESEND_API = "https://api.resend.com/emails";

/**
 * Resend's default sender. Works with no domain set up, but only delivers to
 * the Resend account's own address — see docs/email-setup.md.
 */
const DEFAULT_FROM = "Kaiku <onboarding@resend.dev>";

/**
 * A Stripe webhook must answer within seconds. Ten is generous for a single
 * API call and still far inside that budget.
 */
const REQUEST_TIMEOUT_MS = 10_000;

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /**
   * Plain-text alternative. Optional only because the pre-existing callers of
   * this function predate it; every template in ./ supplies one.
   */
  text?: string;
  replyTo?: string;
}

const warned = new Set<string>();

/**
 * Warn once per distinct misconfiguration, not once per send. Every gate here
 * used to be a silent `return`, which meant a site sending no email at all
 * looked identical to a site with nothing to send — contact submissions sat
 * unread in the CMS for weeks because nothing ever said a notification had been
 * skipped. These lines are the difference between "misconfigured" and "quiet".
 */
function warnOnce(key: string, message: string) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[email] ${message}`);
}

/** Test seam: lets a test assert the first-time warning more than once. */
export function resetEmailWarnings() {
  warned.clear();
}

/**
 * Why a send did or did not happen, in words fit to show an operator.
 *
 * `sendEmail` returns a bare boolean and logs the reason to the server console,
 * which is right for the live paths — a customer's order must not fail because
 * an email did — but useless for the one place whose entire job is to answer
 * "does email work?". The test-sender on /admin/emails reported "Sent" whether
 * or not anything left the building, which is worse than not having a button.
 */
export interface SendOutcome {
  ok: boolean;
  /** Machine-readable cause, for the UI to phrase. */
  reason:
    "sent" | "no-api-key" | "no-from-address" | "rejected" | "network-error";
  /** What Resend actually said, when it said anything. Never includes the key. */
  detail?: string;
}

/** `true` when a send was accepted by Resend. Callers may ignore it. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  return (await sendEmailWithOutcome(input)).ok;
}

/** As `sendEmail`, but says why. Used by the test-sender, not by live sends. */
export async function sendEmailWithOutcome(
  input: SendEmailInput,
): Promise<SendOutcome> {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      warnOnce(
        "no-api-key",
        "RESEND_API_KEY is not set — this deployment sends no email at all. " +
          `Dropped: "${input.subject}" to ${input.to}. ` +
          "See docs/email-setup.md.",
      );
      return {
        ok: false,
        reason: "no-api-key",
        detail:
          "RESEND_API_KEY is not set on this deployment, so nothing is sent at all.",
      };
    }

    if (!env.RESEND_FROM_EMAIL) {
      warnOnce(
        "no-from",
        `RESEND_FROM_EMAIL is not set, so mail is sent as "${DEFAULT_FROM}". ` +
          "Resend's onboarding sender only delivers to the Resend account's own " +
          "address, so mail to anyone else is rejected. Verify kaikuhome.com in " +
          "Resend and set RESEND_FROM_EMAIL to an address on it — see " +
          "docs/email-setup.md.",
      );
    }

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
      signal: timeoutSignal(),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "<unreadable body>");
      console.error(
        `[email] Resend rejected "${input.subject}" to ${input.to} ` +
          `with ${response.status}: ${body}`,
      );
      return {
        ok: false,
        reason: "rejected",
        // Resend's body names the actual problem — an unverified domain, a
        // from-address that is not on it, a bad key. Worth showing verbatim.
        detail: `Resend returned ${response.status}: ${body.slice(0, 400)}`,
      };
    }

    return env.RESEND_FROM_EMAIL
      ? { ok: true, reason: "sent" }
      : {
          ok: true,
          reason: "no-from-address",
          detail:
            `Accepted, but sent as "${DEFAULT_FROM}" because RESEND_FROM_EMAIL is not set. ` +
            "Resend's onboarding sender only delivers to your own Resend account address, " +
            "so mail to anyone else is silently dropped.",
        };
  } catch (error) {
    // Deliberately the last line of defence: anything at all that went wrong
    // above — network, timeout, JSON, a throwing env proxy — stops here.
    console.error(
      `[email] failed to send "${input.subject}" to ${input.to}`,
      error,
    );
    return {
      ok: false,
      reason: "network-error",
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Send a template built by one of the builders in this directory. */
export async function sendBuiltEmail(
  to: string,
  email: BuiltEmail,
  options: { replyTo?: string } = {},
): Promise<boolean> {
  return sendEmail({
    to,
    subject: email.subject,
    html: email.html,
    text: email.text,
    replyTo: options.replyTo,
  });
}

/**
 * `AbortSignal.timeout` is available on every runtime this app targets, but is
 * feature-detected anyway: an undefined `signal` is a slower failure, whereas a
 * `TypeError` here would be a thrown error on the happy path.
 */
function timeoutSignal(): AbortSignal | undefined {
  return typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    : undefined;
}

/**
 * Whether this deployment can send email at all, without sending one.
 *
 * Deliberately reports presence, never values: an admin page has no business
 * displaying an API key, and "is it set" is the entire question.
 */
export function describeEmailConfig(): {
  canSend: boolean;
  hasApiKey: boolean;
  hasFromAddress: boolean;
  fromAddress: string;
} {
  return {
    canSend: Boolean(env.RESEND_API_KEY),
    hasApiKey: Boolean(env.RESEND_API_KEY),
    hasFromAddress: Boolean(env.RESEND_FROM_EMAIL),
    fromAddress: env.RESEND_FROM_EMAIL || DEFAULT_FROM,
  };
}
