"use server";

import "server-only";

import { redirect } from "next/navigation";

import { siteUrl } from "@/config/site";
import { sanityClient } from "@/lib/sanity/client";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/server/stripe/client";

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
  sku: string | null;
  category: string | null;
  supplier: string | null;
  stockStatus: string | null;
  stockQuantity: number | null;
}

const PRICE_LOOKUP_QUERY = /* groq */ `
*[_type == "product" && slug.current in $slugs] {
  "slug": slug.current,
  title,
  price,
  currency,
  "image": gallery[0].asset->url,
  sku,
  "category": category->slug.current,
  "supplier": supplier->name,
  stockStatus,
  stockQuantity
}`;

// stockStatus values that mean "not actually orderable right now" — Backorder
// and Made to Order are deliberately still purchasable, that's their point.
const UNORDERABLE_STOCK_STATUSES = new Set(["Out of Stock", "Coming Soon"]);

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

  // A product's stock can change between "add to basket" (client-cached
  // localStorage state) and checkout — re-validate against the live Sanity
  // record here rather than trusting whatever the cart last knew, same
  // reasoning as re-fetching price below. Quantities are summed per slug
  // first since the same product can appear as more than one line (distinct
  // selectedOptions), but stock is tracked per product, not per variant.
  const quantityBySlug = new Map<string, number>();
  for (const line of lines) {
    quantityBySlug.set(
      line.slug,
      (quantityBySlug.get(line.slug) ?? 0) + line.quantity,
    );
  }
  for (const product of products) {
    if (
      product.stockStatus &&
      UNORDERABLE_STOCK_STATUSES.has(product.stockStatus)
    ) {
      throw new Error(
        `${product.title} is no longer available — please remove it from your basket.`,
      );
    }
    const requested = quantityBySlug.get(product.slug) ?? 0;
    if (
      typeof product.stockQuantity === "number" &&
      requested > product.stockQuantity
    ) {
      throw new Error(
        product.stockQuantity > 0
          ? `Only ${product.stockQuantity} of ${product.title} left in stock — please reduce the quantity in your basket.`
          : `${product.title} is out of stock — please remove it from your basket.`,
      );
    }
  }

  const lineItems = lines.map((line) => {
    const product = products.find((p) => p.slug === line.slug);
    if (!product) {
      throw new Error(`Product no longer available: ${line.slug}`);
    }
    const optionSuffix = line.selectedOptions
      ? ` (${Object.values(line.selectedOptions).join(", ")})`
      : "";
    // Metadata rides along on the ephemeral Stripe Product this line item
    // creates, so the webhook can read it straight back off the line item
    // via listLineItems({ expand: ["data.price.product"] }) — no separate
    // lookup table needed to turn a paid order into a fulfillable one.
    const metadata: Record<string, string> = { slug: product.slug };
    if (product.sku) metadata.sku = product.sku;
    if (product.category) metadata.category = product.category;
    if (product.supplier) metadata.supplier = product.supplier;
    if (line.selectedOptions) {
      metadata.selectedOptions = JSON.stringify(line.selectedOptions);
    }
    return {
      quantity: line.quantity,
      price_data: {
        currency: (product.currency || "GBP").toLowerCase(),
        unit_amount: Math.round(product.price * 100),
        product_data: {
          name: `${product.title}${optionSuffix}`,
          images: product.image ? [product.image] : undefined,
          metadata,
        },
      },
    };
  });

  /**
   * **Guest checkout is allowed.** This reverses an earlier deliberate choice —
   * Damien: "checking out as a guest shouldnt be possible" — made after his
   * first live order was a guest checkout and showed up nowhere in
   * /account/orders. That guarantee (every order attached to an account,
   * visible in order history) still holds; it is just no longer bought by
   * blocking payment on a signup form first.
   *
   * A signed-in visitor still checks out as themselves, unchanged below. A
   * signed-out one pays with no `client_reference_id` and no pre-filled
   * `customer_email` — Stripe's own hosted Checkout page collects the email
   * instead, the same way it always has for anyone Kaiku didn't already know.
   * `persistOrder` (server/webhooks/stripe.ts) is what still closes the loop:
   * a completed session with no `client_reference_id` gets an account
   * found-or-created from that email and attached, after payment, so the
   * order is never left dangling. Nothing here needs to know that happens.
   */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
    // UK-only for now — every product's price already has delivery folded
    // in (see each product's deliveryNotes), so this is a real delivery
    // address collector, not a paid shipping calculator.
    shipping_address_collection: { allowed_countries: ["GB"] },
    // Needed to actually fulfil an order via a trade supplier's order form
    // (delivery/installation booking requires calling the customer).
    phone_number_collection: { enabled: true },
    // Lets a returning customer redeem the second-order code Stripe emails
    // them after their first order (see server/stripe/second-order-offer.ts).
    // Without this the field to type a code into does not exist at all —
    // which is why the original 10% first-order promise could never actually
    // be honoured at checkout.
    allow_promotion_codes: true,
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "gbp" },
          display_name: "Free UK Delivery",
        },
      },
    ],
    // Only set for a signed-in visitor. The webhook reads client_reference_id
    // back out to attach the order to this exact account; left undefined for
    // a guest, Stripe collects the email itself on its own hosted page, and
    // persistOrder resolves an account from that email after payment instead.
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
