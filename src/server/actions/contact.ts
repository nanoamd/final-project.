"use server";

import "server-only";

import { env } from "@/env";
import { sendEmail } from "@/server/integrations/resend";
import { getSanityWriteClient } from "@/server/sanity/write-client";

export interface ContactFormResult {
  ok: boolean;
  error?: string;
}

export async function submitContactForm(
  formData: FormData,
): Promise<ContactFormResult> {
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !message.trim()
  ) {
    return { ok: false, error: "Please fill in every field." };
  }

  const client = getSanityWriteClient();
  if (!client) {
    return {
      ok: false,
      error:
        "Sorry, the contact form isn't available right now — please email us directly instead.",
    };
  }

  try {
    await client.create({
      _type: "contactSubmission",
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("submitContactForm: failed to write to Sanity", err);
    return {
      ok: false,
      error:
        "Something went wrong sending your message — please email us directly instead.",
    };
  }

  // The submission is already safely recorded in Sanity above — an email
  // hiccup from here on is logged (inside sendEmail) but never turns an
  // otherwise-successful submission into an error for the visitor.
  if (!env.ADMIN_EMAIL) {
    // Previously this branch was simply absent, so with ADMIN_EMAIL unset the
    // enquiry was recorded and nobody was ever told. The submission is safe in
    // Sanity either way (and readable at /admin/inbox), but silence here is how
    // real enquiries go unanswered.
    console.warn(
      "[email] ADMIN_EMAIL is not set — a contact enquiry was saved to Sanity " +
        "but no notification was sent to anyone. Set ADMIN_EMAIL to receive them.",
    );
  }

  if (env.ADMIN_EMAIL) {
    await sendEmail({
      to: env.ADMIN_EMAIL,
      subject: `New enquiry from ${name.trim()}`,
      replyTo: email.trim(),
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
          <p style="font-size: 16px; line-height: 1.6;"><strong>${name.trim()}</strong> (${email.trim()}) sent this via the contact form:</p>
          <p style="font-size: 15px; line-height: 1.6; color: #4a4a4a; white-space: pre-wrap;">${message.trim()}</p>
          <p style="font-size: 13px; color: #9a9a9a;">Reply to this email to respond directly.</p>
        </div>
      `,
    });
  }

  await sendEmail({
    to: email.trim(),
    subject: "We've received your message",
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 16px; line-height: 1.6;">Thank you, ${name.trim()}.</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4a4a4a;">
          We've received your message and will get back to you shortly.
        </p>
      </div>
    `,
  });

  return { ok: true };
}
