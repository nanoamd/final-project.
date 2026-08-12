import "server-only";

import { siteConfig } from "@/config/site";

import { absoluteUrl, formatEmailDateTime } from "./format";
import {
  type BuiltEmail,
  button,
  detailTable,
  escapeHtml,
  escapeHtmlWithBreaks,
  eyebrow,
  heading,
  paragraph,
  renderEmail,
  renderText,
  subheading,
} from "./layout";

export interface ContactEmailData {
  name: string;
  email: string;
  message: string;
  submittedAt: Date;
  /** Canonical site origin, no trailing slash. */
  siteUrl: string;
}

/**
 * The owner's copy of a contact-form enquiry.
 *
 * A submission is written to Sanity first and is readable at /admin/inbox, but
 * a record nobody is told about is a record nobody reads — enquiries sat unseen
 * because finding them meant opening Studio on purpose. This email carries the
 * whole message, so the enquiry can be answered from a phone without opening
 * anything.
 *
 * Sent with the enquirer's address as reply-to: hitting reply answers them.
 */
export function buildContactNotificationEmail(
  data: ContactEmailData,
): BuiltEmail {
  const name = data.name.trim();
  const inboxUrl = absoluteUrl(data.siteUrl, "/admin/inbox");
  const subject = `New enquiry from ${name}`;

  const html = renderEmail({
    title: subject,
    preheader: data.message.trim().slice(0, 140),
    content: [
      eyebrow("Contact form"),
      heading(subject),
      detailTable([
        { label: "Name", value: escapeHtml(name) },
        {
          label: "Email",
          value: `<a href="mailto:${escapeHtml(data.email.trim())}" style="color:#c65a2c;">${escapeHtml(
            data.email.trim(),
          )}</a>`,
        },
        {
          label: "Received",
          value: escapeHtml(formatEmailDateTime(data.submittedAt)),
        },
      ]),
      subheading("Their message"),
      paragraph(escapeHtmlWithBreaks(data.message.trim())),
      paragraph(
        "Replying to this email replies to them. The enquiry is also saved in the inbox.",
      ),
      button(inboxUrl, "Open the inbox"),
    ].join("\n"),
  });

  const text = renderText([
    subject.toUpperCase(),
    [
      `Name: ${name}`,
      `Email: ${data.email.trim()}`,
      `Received: ${formatEmailDateTime(data.submittedAt)}`,
    ].join("\n"),
    `THEIR MESSAGE\n${data.message.trim()}`,
    "Replying to this email replies to them. The enquiry is also saved in the inbox.",
    `Open the inbox: ${inboxUrl}`,
  ]);

  return { subject, html, text };
}

/**
 * The enquirer's acknowledgement. Deliberately short: it exists to confirm the
 * message arrived and to set a realistic expectation, not to sell anything.
 * It does not name a response time the shop cannot keep, and it does not offer
 * a phone number — this is a one-person shop that answers by email.
 */
export function buildContactAcknowledgementEmail(
  data: ContactEmailData,
): BuiltEmail {
  const firstName = data.name.trim().split(/\s+/)[0] ?? "";
  const greeting = firstName ? `Thank you, ${firstName}.` : "Thank you.";
  const subject = "We have your message";

  const html = renderEmail({
    title: subject,
    preheader: "Your message has reached us and we will reply by email.",
    content: [
      eyebrow("Contact"),
      heading(greeting),
      paragraph(
        "Your message has reached us. We read every one ourselves and will reply by email, usually within a working day or two.",
      ),
      paragraph(
        `We answer by email only — there is no call centre here. If you need to add anything, reply to this message or write to <a href="mailto:${siteConfig.email}" style="color:#c65a2c;">${siteConfig.email}</a>.`,
      ),
      subheading("What you sent us"),
      paragraph(
        `<span style="color:#6b6a67;">${escapeHtmlWithBreaks(data.message.trim())}</span>`,
      ),
    ].join("\n"),
  });

  const text = renderText([
    greeting,
    "Your message has reached us. We read every one ourselves and will reply by email, usually within a working day or two.",
    `We answer by email only — there is no call centre here. If you need to add anything, reply to this message or write to ${siteConfig.email}.`,
    `WHAT YOU SENT US\n${data.message.trim()}`,
  ]);

  return { subject, html, text };
}
