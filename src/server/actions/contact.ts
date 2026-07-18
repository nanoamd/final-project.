"use server";

import "server-only";

import { createClient } from "@sanity/client";

import { env } from "@/env";

export interface ContactFormResult {
  ok: boolean;
  error?: string;
}

/**
 * Writes to Sanity directly using SANITY_API_WRITE_TOKEN, read straight from
 * process.env rather than the validated env.ts schema — same precedent as
 * scripts/seed-sanity.ts. It's genuinely optional: if it's unset (e.g. a
 * preview deploy without the token), the action fails soft with a clear
 * error instead of a fake success message.
 */
function getWriteClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) return null;
  return createClient({
    projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION,
    token,
    useCdn: false,
  });
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

  const client = getWriteClient();
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
    return { ok: true };
  } catch (err) {
    console.error("submitContactForm: failed to write to Sanity", err);
    return {
      ok: false,
      error:
        "Something went wrong sending your message — please email us directly instead.",
    };
  }
}
