"use server";

import "server-only";

import { getAuthorizedAdmin } from "@/server/auth/admin";
import type { BuiltEmail } from "@/server/emails/layout";
import { buildOrderConfirmationEmail } from "@/server/emails/order-confirmation";
import { emailKeyForStage } from "@/server/emails/order-stage";
import { resolveStageEmail } from "@/server/emails/resolve-email";
import { SAMPLE_CONTEXT, SAMPLE_ORDER } from "@/server/emails/sample-order";
import { sendBuiltEmail } from "@/server/emails/transport";

/**
 * Renders and test-sends the transactional emails, for /admin/emails.
 *
 * Both paths go through `resolveStageEmail`, the same resolver the live sender
 * uses, so what is previewed here is what a customer receives — including
 * whether a Studio template or the built-in version wins.
 */

export interface EmailPreview {
  stage: string;
  label: string;
  subject: string;
  html: string;
  text: string;
  source: "studio" | "built-in";
  templateKey: string;
}

/** Every customer-facing email, in the order an order actually moves through. */
const PREVIEWABLE: { stage: string; label: string }[] = [
  { stage: "__confirmation", label: "Order confirmation (after payment)" },
  { stage: "production", label: "In production" },
  { stage: "tracking", label: "Dispatched, with tracking" },
  { stage: "delivered", label: "Delivered" },
  { stage: "review_requested", label: "Review request" },
  { stage: "on_hold", label: "Delayed" },
  { stage: "cancelled", label: "Cancelled" },
  { stage: "refunded", label: "Refunded" },
];

/**
 * The order confirmation does not come from the stage machine — the Stripe
 * webhook sends it on payment — so it is resolved separately here rather than
 * left out of the previews, which would leave the one email every customer
 * definitely receives untestable.
 */
async function confirmationPreview(): Promise<EmailPreview> {
  const built: BuiltEmail = buildOrderConfirmationEmail(SAMPLE_ORDER);
  return {
    stage: "__confirmation",
    label: "Order confirmation (after payment)",
    subject: built.subject,
    html: built.html,
    text: built.text,
    source: "built-in",
    templateKey: "order-confirmation",
  };
}

export async function getEmailPreviews(): Promise<EmailPreview[]> {
  if (!(await getAuthorizedAdmin())) return [];

  const previews: EmailPreview[] = [await confirmationPreview()];

  for (const { stage, label } of PREVIEWABLE) {
    if (stage === "__confirmation") continue;
    const resolved = await resolveStageEmail({
      stage,
      order: SAMPLE_ORDER,
      context: SAMPLE_CONTEXT,
    });
    if (!resolved) continue;
    previews.push({
      stage,
      label,
      subject: resolved.built.subject,
      html: resolved.built.html,
      text: resolved.built.text,
      source: resolved.source,
      templateKey: resolved.templateKey,
    });
  }

  return previews;
}

export interface SendTestResult {
  ok: boolean;
  message: string;
}

/**
 * Sends one email to a real address so it can be judged where it actually
 * matters — in Gmail, in Outlook, on a phone. A browser preview cannot tell you
 * that Outlook broke your layout or that the images were blocked.
 */
export async function sendTestEmail(
  stage: string,
  to: string,
): Promise<SendTestResult> {
  if (!(await getAuthorizedAdmin()))
    return { ok: false, message: "Not signed in." };

  const address = to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    return { ok: false, message: "That does not look like an email address." };

  const built =
    stage === "__confirmation"
      ? buildOrderConfirmationEmail(SAMPLE_ORDER)
      : (
          await resolveStageEmail({
            stage,
            order: SAMPLE_ORDER,
            context: SAMPLE_CONTEXT,
          })
        )?.built;

  if (!built)
    return { ok: false, message: "That stage does not send an email." };

  // Prefixed so a test can never be mistaken for a real order's email if it
  // is forwarded or found again later.
  await sendBuiltEmail(address, {
    ...built,
    subject: `[TEST] ${built.subject}`,
  });

  return {
    ok: true,
    message: `Sent to ${address}. If nothing arrives, RESEND_API_KEY or RESEND_FROM_EMAIL is not set — check the deploy logs.`,
  };
}

export async function listPreviewableStages(): Promise<
  { stage: string; label: string; sends: boolean }[]
> {
  return PREVIEWABLE.map(({ stage, label }) => ({
    stage,
    label,
    sends: stage === "__confirmation" || emailKeyForStage(stage) !== null,
  }));
}
