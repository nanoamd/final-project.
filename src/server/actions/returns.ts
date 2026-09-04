"use server";

import "server-only";

import { siteUrl } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { buildReturnRequestedEmail } from "@/server/emails/form-acknowledgements";
import { resolveFormEmail } from "@/server/emails/resolve-email";
import { sendEmail } from "@/server/integrations/resend";
import {
  assessReturn,
  isFault,
  type ReturnReason,
} from "@/server/returns/eligibility";
import { getSanityWriteClient } from "@/server/sanity/write-client";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * Photograph evidence for a return — the one thing `assessReturn` already
 * asked for (a transit-damage claim without photos is unlikely to succeed
 * with the carrier) but that nothing collected until now. Same upload shape
 * as the quote form's attachments: Sanity is the asset store regardless of
 * which system owns the parent record, and a photo that fails to upload is
 * noted rather than failing the whole request — losing one photo is
 * recoverable, losing the return request is not.
 */
const MAX_RETURN_PHOTOS = 6;
const MAX_RETURN_PHOTO_BYTES = 15 * 1024 * 1024;
const ACCEPTED_PHOTO_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
];

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

async function uploadReturnPhotos(formData: FormData): Promise<string[]> {
  const client = getSanityWriteClient();
  if (!client) return [];

  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, MAX_RETURN_PHOTOS);

  const urls: string[] = [];
  let uploadedBytes = 0;

  for (const file of files) {
    if (!ACCEPTED_PHOTO_EXTENSIONS.includes(extensionOf(file.name))) continue;
    if (uploadedBytes + file.size > MAX_RETURN_PHOTO_BYTES) continue;
    try {
      const asset = await client.assets.upload(
        "image",
        Buffer.from(await file.arrayBuffer()),
        {
          filename: file.name,
          ...(file.type ? { contentType: file.type } : {}),
        },
      );
      urls.push(asset.url);
      uploadedBytes += file.size;
    } catch (err) {
      console.error(`requestReturn: failed to upload photo ${file.name}`, err);
    }
  }

  return urls;
}

/**
 * Requesting a return.
 *
 * The published policy tells a customer to "contact us with your order number
 * and we'll guide you through the next steps", which in practice meant an email
 * into an inbox with no reference and nothing tying it to the order. This gives
 * the request a record, a reference, and an immediate honest answer.
 *
 * **The assessment is never the final word.** `assessReturn` produces accept,
 * review or decline; a decline is only ever reachable for change-of-mind past
 * the statutory window, and even then the customer is pointed at the fault
 * route, which has no deadline. Everything else that is not clean goes to a
 * human. See `server/returns/eligibility.ts` for the reasoning.
 */

export interface ReturnRequestResult {
  ok: boolean;
  /** The KR- reference, once one exists. */
  returnNumber?: string;
  decision?: "accept" | "review" | "decline";
  /** What to show the customer. Already written for them, not for us. */
  message?: string;
  error?: string;
}

const REASONS: ReturnReason[] = [
  "change-of-mind",
  "faulty",
  "damaged-in-transit",
  "not-as-described",
  "wrong-item",
];

/** A reason the caller sent, or null if it is not one we offer. */
function readReason(value: unknown): ReturnReason | null {
  return typeof value === "string" && REASONS.includes(value as ReturnReason)
    ? (value as ReturnReason)
    : null;
}

export async function requestReturn(
  formData: FormData,
): Promise<ReturnRequestResult> {
  // Signed in, and it must be their own order. Checkout requires an account, so
  // every order has an owner to check against.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: "Please sign in to your account to start a return.",
    };
  }

  const orderId = formData.get("orderId");
  const reason = readReason(formData.get("reason"));
  if (typeof orderId !== "string" || !orderId) {
    return { ok: false, error: "We could not tell which order this is about." };
  }
  if (!reason) {
    return { ok: false, error: "Please tell us why you want to return it." };
  }

  const detail = String(formData.get("detail") ?? "")
    .trim()
    .slice(0, 4000);
  const unused = formData.get("unused") === "yes";
  const originalPackaging = formData.get("originalPackaging") === "yes";

  // A fault with no description is a support ticket with no content — ask now
  // rather than emailing back and forth for it.
  if (isFault(reason) && detail.length < 10) {
    return {
      ok: false,
      error:
        "Please tell us briefly what's wrong — a sentence is plenty, and it saves us asking.",
    };
  }

  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, order_number, user_id, email, customer_name, actual_delivery_date, stage, line_items",
    )
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { ok: false, error: "We could not find that order." };
  }

  // Checked against the order's owner rather than trusting the form: this action
  // is a public endpoint, and `orderId` came from the browser.
  if (order.user_id !== user.id) {
    return { ok: false, error: "That order is not on your account." };
  }

  // One open return per order at a time. A customer clicking twice should not
  // create two references for the same goods.
  const { data: existing } = await admin
    .from("returns")
    .select("return_number, status")
    .eq("order_id", orderId)
    .not("status", "in", '("refunded","replaced","rejected")')
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      error: `You already have a return open for this order (${existing.return_number}). Reply to that email and we'll pick it up there.`,
    };
  }

  const lineItems = Array.isArray(order.line_items) ? order.line_items : [];
  const madeToOrder = looksMadeToOrder(lineItems);

  // Uploaded before the assessment runs — a photo count of 0 when the
  // customer genuinely attached one would tell them their own claim is
  // "very unlikely to succeed" for no reason.
  const photoUrls = await uploadReturnPhotos(formData);

  const assessment = assessReturn({
    reason,
    deliveredAt: order.actual_delivery_date
      ? new Date(order.actual_delivery_date)
      : null,
    madeToOrder,
    // Anything past the supplier being notified is in production as far as the
    // customer's goods are concerned.
    productionStarted: !["paid", "review"].includes(order.stage ?? ""),
    unused,
    originalPackaging,
    photoCount: photoUrls.length,
  });

  const { data: created, error: insertError } = await admin
    .from("returns")
    .insert({
      order_id: order.id,
      email: order.email,
      customer_name: order.customer_name,
      reason,
      detail: detail || null,
      photo_urls: photoUrls,
      unused,
      original_packaging: originalPackaging,
      line_items: lineItems,
      decision: assessment.decision,
      decision_notes: assessment.notes,
      return_shipping_paid_by: assessment.returnShippingPaidBy,
      supplier_window_likely_closed: assessment.supplierWindowLikelyClosed,
      status: assessment.decision === "accept" ? "approved" : "requested",
    })
    .select("return_number")
    .single();

  if (insertError || !created) {
    console.error("[returns] could not record the request", insertError);
    return {
      ok: false,
      error:
        "Something went wrong saving your request. Please email us and we'll sort it out by hand.",
    };
  }

  // Onto the order's timeline, so it appears in admin next to everything else
  // that has happened to this order rather than in a silo.
  await admin.from("order_events").insert({
    order_id: order.id,
    type: "return_requested",
    title: `Return ${created.return_number} requested — ${reason.replace(/-/g, " ")}`,
    detail: [
      assessment.decision.toUpperCase(),
      `return shipping: ${assessment.returnShippingPaidBy}`,
      ...assessment.notes,
      detail ? `Customer said: ${detail}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    actor: "customer",
  });

  // The return is already safely recorded above — an email hiccup from here
  // on is logged (inside sendEmail) but never turns an otherwise-successful
  // request into an error for the customer. Same fail-soft shape as the
  // contact and quote forms.
  if (order.email) {
    const { built } = await resolveFormEmail({
      templateKey: "return-requested",
      variables: {
        customerName: order.customer_name ?? "",
        siteUrl,
        returnNumber: created.return_number,
        reason,
        customerMessage: assessment.customerMessage,
        returnShippingPaidBy: assessment.returnShippingPaidBy,
      },
      fallback: () =>
        buildReturnRequestedEmail({
          customerName: order.customer_name ?? "",
          siteUrl,
          returnNumber: created.return_number,
          reason,
          customerMessage: assessment.customerMessage,
          returnShippingPaidBy: assessment.returnShippingPaidBy,
        }),
    });

    await sendEmail({
      to: order.email,
      subject: built.subject,
      html: built.html,
      text: built.text,
    });
  }

  return {
    ok: true,
    returnNumber: created.return_number,
    decision: assessment.decision,
    message: assessment.customerMessage,
  };
}

/**
 * Whether anything on the order is made to order.
 *
 * Read from the line-item snapshot's lead time rather than from Sanity: what
 * matters is what the customer was told when they bought it, not what the
 * product says today.
 */
function looksMadeToOrder(lineItems: unknown[]): boolean {
  return lineItems.some((item) => {
    const leadTime = (item as { leadTime?: unknown }).leadTime;
    return (
      typeof leadTime === "string" &&
      /\b(made to order|made-to-order|weeks?)\b/i.test(leadTime)
    );
  });
}
