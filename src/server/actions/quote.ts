"use server";

import "server-only";

import crypto from "node:crypto";

import { siteUrl } from "@/config/site";
import { env } from "@/env";
import { buildQuoteReceivedEmail } from "@/server/emails/form-acknowledgements";
import { resolveFormEmail } from "@/server/emails/resolve-email";
import { sendEmail } from "@/server/integrations/resend";
import { getSanityWriteClient } from "@/server/sanity/write-client";

/**
 * Quote requests are the highest-value thing this site collects, so the
 * ordering below is deliberate and matches `submitContactForm`:
 *
 *   1. validate,
 *   2. persist to Sanity — the submission is safe from this point,
 *   3. only then attempt email.
 *
 * `RESEND_API_KEY` is currently unset, so step 3 is a no-op that warns once
 * (see `sendEmail`). Nothing about the visitor's success depends on it: the
 * enquiry is already stored, and turning email on later is purely a matter of
 * setting the two env vars.
 */

export type QuoteFieldName =
  "projectType" | "requirements" | "name" | "email" | "phone";

export interface QuoteRequestResult {
  ok: boolean;
  /** Human-quotable reference, shown to the customer on success. */
  reference?: string;
  /** Whole-form failure message. */
  error?: string;
  /** Per-field messages, rendered under the offending field. */
  fieldErrors?: Partial<Record<QuoteFieldName, string>>;
}

const MAX_PROJECT_TYPES = 12;
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_TOTAL_BYTES = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
  "pdf",
];

const LIMITS = {
  name: 120,
  email: 200,
  phone: 40,
  company: 160,
  postcode: 16,
  products: 600,
  choice: 80,
  requirements: 8000,
} as const;

/** Deliberately loose — the strict grammar rejects addresses that work. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readText(formData: FormData, key: string, limit: number): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, limit);
}

function readChoices(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().slice(0, LIMITS.choice))
    .filter(Boolean)
    .slice(0, MAX_PROJECT_TYPES);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

/**
 * `KQ-` plus six hex characters. Short enough to read down a phone, and the
 * customer sees it on the confirmation screen, so an enquiry can be picked up
 * mid-conversation without hunting through a date-ordered list.
 */
function newReference(): string {
  return `KQ-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

interface QuotePayload {
  reference: string;
  submittedAt: string;
  projectTypes: string[];
  products: string;
  postcode: string;
  timescale: string;
  budget: string;
  siteReadiness: string;
  powerSupply: string;
  requirements: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  spamSuspected: boolean;
}

/**
 * One readable rendering of the whole enquiry, stored on the document
 * alongside the structured fields. Anything that can read a string — Vision, a
 * future inbox, a notification — can then show the complete request without
 * having to know every field name.
 */
function buildSummary(payload: QuotePayload): string {
  const lines: string[] = [
    `Reference: ${payload.reference}`,
    `From: ${payload.name} <${payload.email}>`,
  ];
  if (payload.phone) lines.push(`Phone: ${payload.phone}`);
  if (payload.company) lines.push(`Company: ${payload.company}`);
  lines.push(`Project: ${payload.projectTypes.join(", ")}`);
  if (payload.products) lines.push(`Products of interest: ${payload.products}`);
  if (payload.postcode) lines.push(`Postcode: ${payload.postcode}`);
  if (payload.timescale) lines.push(`Timescale: ${payload.timescale}`);
  if (payload.budget) lines.push(`Budget guide: ${payload.budget}`);
  if (payload.siteReadiness) lines.push(`Site: ${payload.siteReadiness}`);
  if (payload.powerSupply) lines.push(`Power: ${payload.powerSupply}`);
  lines.push("", "Requirements:", payload.requirements);
  return lines.join("\n");
}

export async function submitQuoteRequest(
  formData: FormData,
): Promise<QuoteRequestResult> {
  const projectTypes = readChoices(formData, "projectType");
  const requirements = readText(formData, "requirements", LIMITS.requirements);
  const name = readText(formData, "name", LIMITS.name);
  const email = readText(formData, "email", LIMITS.email);

  const fieldErrors: Partial<Record<QuoteFieldName, string>> = {};
  if (projectTypes.length === 0) {
    fieldErrors.projectType =
      "Please choose at least one so we know who to ask.";
  }
  if (!requirements) {
    fieldErrors.requirements =
      "A sentence or two is enough to get started — the space, and how you'll use it.";
  }
  if (!name) fieldErrors.name = "Please tell us your name.";
  if (!email) {
    fieldErrors.email = "We need an email address to send the quotation to.";
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email =
      "That email address doesn't look right — please check it.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const payload: QuotePayload = {
    reference: newReference(),
    submittedAt: new Date().toISOString(),
    projectTypes,
    products: readText(formData, "products", LIMITS.products),
    postcode: readText(formData, "postcode", LIMITS.postcode),
    timescale: readText(formData, "timescale", LIMITS.choice),
    budget: readText(formData, "budget", LIMITS.choice),
    siteReadiness: readText(formData, "siteReadiness", LIMITS.choice),
    powerSupply: readText(formData, "powerSupply", LIMITS.choice),
    requirements,
    name,
    email,
    phone: readText(formData, "phone", LIMITS.phone),
    company: readText(formData, "company", LIMITS.company),
    // Honeypot. Flagged rather than discarded: a browser that autofills the
    // hidden field would otherwise silently bin a real enquiry, which is a
    // far worse failure than a flagged document a human glances at.
    spamSuspected: Boolean(readText(formData, "_hp", 200)),
  };

  const client = getSanityWriteClient();
  if (!client) {
    console.error(
      "submitQuoteRequest: SANITY_API_WRITE_TOKEN is not set — a quote " +
        `request from ${payload.email} could not be stored.`,
    );
    return {
      ok: false,
      error:
        "Sorry — the quote form isn't available right now. Please email us and we'll pick it up straight away.",
    };
  }

  // Attachments are uploaded before the document is created so the document
  // can reference them. A file that fails is recorded as a note rather than
  // failing the submission: losing a photo is recoverable, losing the enquiry
  // is not.
  const files = formData
    .getAll("attachments")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, MAX_ATTACHMENTS);

  const attachments: {
    _type: "file";
    _key: string;
    asset: { _type: "reference"; _ref: string };
  }[] = [];
  const attachmentNotes: string[] = [];
  let uploadedBytes = 0;

  for (const file of files) {
    if (!ACCEPTED_EXTENSIONS.includes(extensionOf(file.name))) {
      attachmentNotes.push(`${file.name} — not an accepted file type, skipped`);
      continue;
    }
    if (uploadedBytes + file.size > MAX_ATTACHMENT_TOTAL_BYTES) {
      attachmentNotes.push(`${file.name} — over the size limit, skipped`);
      continue;
    }
    try {
      const asset = await client.assets.upload(
        "file",
        Buffer.from(await file.arrayBuffer()),
        {
          filename: file.name,
          ...(file.type ? { contentType: file.type } : {}),
        },
      );
      attachments.push({
        _type: "file",
        _key: crypto.randomUUID(),
        asset: { _type: "reference", _ref: asset._id },
      });
      uploadedBytes += file.size;
    } catch (err) {
      console.error(
        `submitQuoteRequest: failed to upload attachment ${file.name}`,
        err,
      );
      attachmentNotes.push(`${file.name} — upload failed, ask the customer`);
    }
  }

  try {
    await client.create({
      _type: "quoteRequest",
      status: "new",
      reference: payload.reference,
      submittedAt: payload.submittedAt,
      name: payload.name,
      email: payload.email,
      ...(payload.phone ? { phone: payload.phone } : {}),
      ...(payload.company ? { company: payload.company } : {}),
      projectTypes: payload.projectTypes,
      ...(payload.products ? { products: payload.products } : {}),
      ...(payload.postcode ? { postcode: payload.postcode } : {}),
      ...(payload.timescale ? { timescale: payload.timescale } : {}),
      ...(payload.budget ? { budget: payload.budget } : {}),
      ...(payload.siteReadiness
        ? { siteReadiness: payload.siteReadiness }
        : {}),
      ...(payload.powerSupply ? { powerSupply: payload.powerSupply } : {}),
      requirements: payload.requirements,
      ...(attachments.length > 0 ? { attachments } : {}),
      ...(attachmentNotes.length > 0
        ? { attachmentNotes: attachmentNotes.join("\n") }
        : {}),
      ...(payload.spamSuspected ? { spamSuspected: true } : {}),
      summary: buildSummary(payload),
    });
  } catch (err) {
    // Last-resort persistence. If Sanity is unreachable the enquiry is still
    // recoverable from the log, which is the difference between a bad hour and
    // a lost customer.
    console.error("submitQuoteRequest: failed to write to Sanity", err);
    console.error(
      "submitQuoteRequest: unstored quote request follows\n" +
        buildSummary(payload),
    );
    return {
      ok: false,
      error:
        "Something went wrong sending your request — please email us instead and we'll reply today.",
    };
  }

  // Stored. Everything below is notification, and none of it can fail the
  // submission: `sendEmail` logs and swallows its own errors.
  if (!env.ADMIN_EMAIL) {
    console.warn(
      `[email] ADMIN_EMAIL is not set — quote request ${payload.reference} was ` +
        "saved to Sanity but nobody was notified. Set ADMIN_EMAIL to receive them.",
    );
  } else {
    const rows = buildSummary(payload)
      .split("\n")
      .map((line) => escapeHtml(line))
      .join("<br />");
    await sendEmail({
      to: env.ADMIN_EMAIL,
      subject: `Quote request ${payload.reference} — ${payload.projectTypes[0]}`,
      replyTo: payload.email,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
          <p style="font-size: 16px; line-height: 1.6;"><strong>${escapeHtml(payload.name)}</strong> requested a quotation.</p>
          <p style="font-size: 15px; line-height: 1.7; color: #4a4a4a;">${rows}</p>
          ${
            attachments.length > 0
              ? `<p style="font-size: 13px; color: #9a9a9a;">${attachments.length} attachment(s) are on the quote request in Sanity.</p>`
              : ""
          }
          <p style="font-size: 13px; color: #9a9a9a;">Reply to this email to respond directly.</p>
        </div>
      `,
    });
  }

  // Through the resolver so a Studio template can replace it, and through the
  // shared layout either way. A quote enquiry is the highest-value thing this
  // site collects; its acknowledgement should not be the plainest email Kaiku
  // sends, which is what a bare Georgia `<div>` made it.
  const { built } = await resolveFormEmail({
    templateKey: "quote-received",
    variables: {
      customerName: payload.name,
      reference: payload.reference,
      shopUrl: `${siteUrl}/shop`,
      projectTypes: payload.projectTypes.join(", ") || null,
    },
    fallback: () =>
      buildQuoteReceivedEmail({
        customerName: payload.name,
        reference: payload.reference,
        siteUrl,
        projectTypes: payload.projectTypes,
      }),
  });

  await sendEmail({
    to: payload.email,
    subject: built.subject,
    html: built.html,
    text: built.text,
  });

  return { ok: true, reference: payload.reference };
}
