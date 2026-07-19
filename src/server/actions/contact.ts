"use server";

import "server-only";

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
