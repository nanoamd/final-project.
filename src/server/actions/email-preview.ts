"use server";

import "server-only";

import { siteUrl } from "@/config/site";
import { EMAIL_KINDS, type EmailKind } from "@/lib/emails/catalogue";
import { getAuthorizedAdmin } from "@/server/auth/admin";
import {
  buildContactReceivedEmail,
  buildQuoteReceivedEmail,
} from "@/server/emails/form-acknowledgements";
import { buildNewsletterWelcomeEmail } from "@/server/emails/newsletter-welcome";
import {
  resolveConfirmationEmail,
  resolveFormEmail,
  resolveStageEmail,
} from "@/server/emails/resolve-email";
import { SAMPLE_CONTEXT, SAMPLE_ORDER } from "@/server/emails/sample-order";
import { sendBuiltEmail } from "@/server/emails/transport";

/**
 * Renders and test-sends every email Kaiku sends, for /admin/emails.
 *
 * The list comes from the shared catalogue rather than a second list kept here,
 * and every preview goes through the same resolver the live sender uses. Both
 * points matter for the same reason: a preview built from its own list, or its
 * own rendering path, tells you about the preview rather than about what the
 * customer gets. This page previously listed eight emails when the code sent
 * eleven, and three of them could not be reached at all.
 */

export interface EmailPreview {
  /** The catalogue key — also the id the client passes back to test-send. */
  key: string;
  label: string;
  /** What makes it send, shown so a preview is not mistaken for a schedule. */
  when: string;
  subject: string;
  html: string;
  text: string;
  source: "studio" | "built-in";
}

/** Sample data for the form emails, matching SAMPLE_ORDER's tone. */
const SAMPLE_QUOTE = {
  customerName: "Alex Hartley",
  reference: "KQ-4821",
  siteUrl,
  projectTypes: ["Garden sauna", "Cold plunge"],
};

const SAMPLE_CONTACT = {
  customerName: "Alex Hartley",
  siteUrl,
  message:
    "Hello — we are looking at the two-seater sauna for a garden in Buckinghamshire. Is the door reversible, and can it be delivered through a side gate about 900mm wide?",
};

/** Resolves one catalogue entry into a preview, or `null` if it cannot send. */
async function previewFor(kind: EmailKind): Promise<EmailPreview | null> {
  const base = { key: kind.key, label: kind.label, when: kind.when };

  if (kind.trigger === "payment") {
    const { built, source } = await resolveConfirmationEmail(SAMPLE_ORDER);
    return { ...base, ...built, source };
  }

  if (kind.trigger === "stage") {
    if (!kind.stage) return null;
    const resolved = await resolveStageEmail({
      stage: kind.stage,
      order: SAMPLE_ORDER,
      context: SAMPLE_CONTEXT,
    });
    if (!resolved) return null;
    return { ...base, ...resolved.built, source: resolved.source };
  }

  const resolved = await resolveFormEmail(formArgs(kind.key));
  return { ...base, ...resolved.built, source: resolved.source };
}

/** The template key, variables and built-in fallback for a form email. */
function formArgs(key: string) {
  switch (key) {
    case "quote-received":
      return {
        templateKey: key,
        variables: {
          customerName: SAMPLE_QUOTE.customerName,
          reference: SAMPLE_QUOTE.reference,
          shopUrl: `${siteUrl}/shop`,
          projectTypes: SAMPLE_QUOTE.projectTypes.join(", "),
        },
        fallback: () => buildQuoteReceivedEmail(SAMPLE_QUOTE),
      };
    case "contact-received":
      return {
        templateKey: key,
        variables: {
          customerName: SAMPLE_CONTACT.customerName,
          shopUrl: `${siteUrl}/shop`,
          message: SAMPLE_CONTACT.message,
        },
        fallback: () => buildContactReceivedEmail(SAMPLE_CONTACT),
      };
    default: {
      // newsletter-welcome. The unsubscribe link is a real route shape with a
      // sample id, so the preview shows the layout the subscriber gets.
      const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe/sample-subscriber`;
      return {
        templateKey: "newsletter-welcome",
        variables: { unsubscribeUrl, shopUrl: `${siteUrl}/shop`, siteUrl },
        fallback: () =>
          buildNewsletterWelcomeEmail({
            unsubscribeUrl,
            siteUrl,
            // No discount engine exists yet — see newsletter-welcome.ts.
            discountCode: null,
          }),
      };
    }
  }
}

export async function getEmailPreviews(): Promise<EmailPreview[]> {
  if (!(await getAuthorizedAdmin())) return [];

  const previews: EmailPreview[] = [];
  for (const kind of EMAIL_KINDS) {
    const preview = await previewFor(kind);
    if (preview) previews.push(preview);
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
  key: string,
  to: string,
): Promise<SendTestResult> {
  if (!(await getAuthorizedAdmin()))
    return { ok: false, message: "Not signed in." };

  const address = to.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))
    return { ok: false, message: "That does not look like an email address." };

  const kind = EMAIL_KINDS.find((entry) => entry.key === key);
  if (!kind) return { ok: false, message: "No such email." };

  const preview = await previewFor(kind);
  if (!preview)
    return { ok: false, message: "That one does not send an email." };

  // Prefixed so a test can never be mistaken for a real order's email if it
  // is forwarded or found again later.
  await sendBuiltEmail(address, {
    subject: `[TEST] ${preview.subject}`,
    html: preview.html,
    text: preview.text,
  });

  return {
    ok: true,
    message: `Sent to ${address}. If nothing arrives, RESEND_API_KEY or RESEND_FROM_EMAIL is not set — check the deploy logs.`,
  };
}
