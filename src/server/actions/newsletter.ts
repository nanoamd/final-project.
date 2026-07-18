"use server";

import "server-only";

import { createClient } from "@sanity/client";

import { env } from "@/env";

export interface NewsletterResult {
  ok: boolean;
  error?: string;
}

/** Same write-client pattern as src/server/actions/contact.ts. */
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

export async function subscribeToNewsletter(
  email: string,
): Promise<NewsletterResult> {
  if (!email.trim()) {
    return { ok: false, error: "Please enter your email." };
  }

  const client = getWriteClient();
  if (!client) {
    return { ok: false, error: "Sign-up isn't available right now." };
  }

  try {
    const existing = await client.fetch<string | null>(
      `*[_type == "newsletterSubscriber" && email == $email][0]._id`,
      { email: email.trim() },
    );
    if (!existing) {
      await client.create({
        _type: "newsletterSubscriber",
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
      });
    }
    return { ok: true };
  } catch (err) {
    console.error("subscribeToNewsletter: failed to write to Sanity", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
