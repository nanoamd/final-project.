"use server";

import "server-only";

import { redirect } from "next/navigation";

import { env } from "@/env";
import { sanityClient } from "@/lib/sanity/client";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/server/stripe/client";

export interface CheckoutLineInput {
  slug: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

interface PriceLookup {
  slug: string;
  title: string;
  price: number;
  currency: string;
  image: string | null;
}

const PRICE_LOOKUP_QUERY = /* groq */ `
*[_type == "product" && slug.current in $slugs] {
  "slug": slug.current,
  title,
  price,
  currency,
  "image": gallery[0].asset->url
}`;

/**
 * Creates a Stripe Checkout Session and redirects to it. Line-item prices are
 * re-fetched from Sanity here — the client's cart state (localStorage) is
 * never trusted for payment amounts. Builds Stripe line items dynamically via
 * `price_data` rather than requiring a pre-synced Stripe product catalog.
 */
export async function createCheckoutSession(lines: CheckoutLineInput[]) {
  if (!lines.length) {
    throw new Error("Cannot check out an empty cart.");
  }

  const slugs = [...new Set(lines.map((line) => line.slug))];
  const products = await sanityClient.fetch<PriceLookup[]>(PRICE_LOOKUP_QUERY, {
    slugs,
  });

  const lineItems = lines.map((line) => {
    const product = products.find((p) => p.slug === line.slug);
    if (!product) {
      throw new Error(`Product no longer available: ${line.slug}`);
    }
    const optionSuffix = line.selectedOptions
      ? ` (${Object.values(line.selectedOptions).join(", ")})`
      : "";
    return {
      quantity: line.quantity,
      price_data: {
        currency: (product.currency || "GBP").toLowerCase(),
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: `${product.title}${optionSuffix}`,
          images: product.image ? [product.image] : undefined,
        },
      },
    };
  });

  // Signed-in customers get their order linked to their account (via
  // client_reference_id, read back out in the Stripe webhook) so it shows up
  // in their order history — guest checkout still works exactly as before.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
    ...(user
      ? { client_reference_id: user.id, customer_email: user.email }
      : {}),
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  // `redirect()`'s typed-routes signature only accepts known internal
  // routes; Stripe's hosted checkout URL is external by design.
  redirect(session.url as Parameters<typeof redirect>[0]);
}
