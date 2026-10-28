import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { GoogleCustomerReviews } from "@/features/storefront/components/analytics/google-customer-reviews";
import { TrackPurchase } from "@/features/storefront/components/analytics/track-purchase";
import { ClearCartOnMount } from "@/features/storefront/components/content/clear-cart-on-mount";
import type { AnalyticsItem } from "@/lib/analytics/events";
import { handlingDays, slowestWindow } from "@/lib/catalog/delivery";
import { formatPriceExact } from "@/lib/format";
import { getProductsBySlugs } from "@/lib/sanity/queries";
import { getStripe } from "@/server/stripe/client";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

/**
 * Our Merchant Center account, for the Customer Reviews opt-in.
 *
 * Hard-coded rather than an env var on purpose: it is a public identifier that
 * ships in the page's own JavaScript anyway, and one more unset variable in
 * Vercel is one more thing that silently does nothing.
 */
const GOOGLE_MERCHANT_ID = 5837554079;

/**
 * When Google should email the buyer to ask how it went.
 *
 * The survey has to land after the goods do, so this takes the LONGEST lead
 * time in the basket, uses its upper bound, and adds three working days for
 * the carrier. Asking a week early reads as a shop that does not know where its
 * own order is; asking late costs nothing.
 */
function estimatedDeliveryDate(windows: (string | null)[]): string {
  const maxDays = windows.reduce((longest, w) => {
    const days = handlingDays(w);
    return days ? Math.max(longest, days.max) : longest;
  }, 14);
  const date = new Date();
  date.setDate(date.getDate() + maxDays + 3);
  return date.toISOString().slice(0, 10);
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let amount: number | null = null;
  let email: string | null = null;
  // Read from the session rather than assumed: we sell UK-only today, but a
  // hard-coded "GB" would silently mis-time the survey the day that changes.
  let deliveryCountry: string | null = null;
  // The lines are read back from Stripe rather than from the basket, because
  // ClearCartOnMount empties the basket on this very page and the two would race.
  // Each line carries the product slug in its metadata (set in the checkout action),
  // which is the same identifier the Merchant feed uses — so GA4, Meta and Merchant
  // Centre all name the product the same way.
  let items: AnalyticsItem[] = [];
  if (session_id) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id, {
        expand: ["line_items.data.price.product"],
      });
      amount = session.amount_total ? session.amount_total / 100 : null;
      email = session.customer_details?.email ?? null;
      deliveryCountry =
        session.collected_information?.shipping_details?.address?.country ??
        session.customer_details?.address?.country ??
        null;
      items = (session.line_items?.data ?? []).flatMap((line) => {
        const product = line.price?.product;
        if (!product || typeof product === "string" || product.deleted)
          return [];
        const slug = product.metadata?.slug;
        if (!slug) return [];
        return [
          {
            slug,
            name: product.name ?? slug,
            price: (line.price?.unit_amount ?? 0) / 100,
            quantity: line.quantity ?? 1,
            category: product.metadata?.category,
          },
        ];
      });
    } catch (error) {
      console.error("[checkout/success] failed to retrieve session:", error);
    }
  }

  /**
   * GTINs and lead times, looked up from what was actually bought.
   *
   * Stripe carries the slug in each line's metadata — the same identifier the
   * Merchant feed uses — so this reconciles an order back to the catalogue
   * without a second source of truth. A GTIN attaches the review to the product
   * as well as to the shop, which is worth more than a seller rating alone.
   */
  let gtins: string[] = [];
  let deliveryWindows: (string | null)[] = [];
  let arrival: string | null = null;
  if (items.length) {
    try {
      const products = await getProductsBySlugs(items.map((i) => i.slug));
      gtins = products
        .map((p) => p.gtin)
        .filter((g): g is string => Boolean(g));
      deliveryWindows = products.map((p) => p.deliveryLeadTime ?? null);
      // The same window the basket quoted, from the same rule. This page
      // already loaded the products to time the Google survey and then told
      // the buyer none of it.
      arrival = slowestWindow(
        products.map((product) => ({
          price: product.price,
          supplierName: product.supplier?.name,
          deliveryLeadTime: product.deliveryLeadTime,
        })),
      );
    } catch (error) {
      console.error("[checkout/success] failed to load product data:", error);
    }
  }

  return (
    <Container className="py-24 text-center md:py-32">
      <ClearCartOnMount />
      {session_id ? (
        <TrackPurchase
          orderId={session_id}
          items={items}
          value={amount ?? undefined}
        />
      ) : null}
      {session_id && email ? (
        <GoogleCustomerReviews
          merchantId={GOOGLE_MERCHANT_ID}
          orderId={session_id}
          email={email}
          deliveryCountry={deliveryCountry ?? "GB"}
          estimatedDeliveryDate={estimatedDeliveryDate(deliveryWindows)}
          gtins={gtins}
        />
      ) : null}
      <CheckCircle2 className="text-brass mx-auto size-12" strokeWidth={1.3} />
      <h1 className="font-display text-ink mt-6 text-3xl tracking-tight sm:text-4xl">
        Thank you for your order
      </h1>
      <p className="text-muted mx-auto mt-3 max-w-md">
        Your order is placed and your payment has gone through
        {amount ? ` — ${formatPriceExact(amount)}` : ""}.
      </p>

      {/**
       * What this page used to say was "A confirmation has been sent to
       * {email}", unconditionally, on a page that has no idea whether one
       * was: `sendBuiltEmail` is fail-soft by contract, and it logs and
       * swallows when `RESEND_API_KEY` is unset. Telling a buyer an email is
       * on its way and then sending nothing is the worst version of this
       * page, because the one thing they will do about it is wait.
       *
       * So it now says what is certainly true, gives them the reference to
       * quote, and tells them what to do if nothing arrives. Confirmation on
       * a durable medium is required (CCR 2013 reg. 16) — this is what makes
       * the obligation recoverable when the send fails.
       */}
      <div className="border-line bg-paper mx-auto mt-10 max-w-md rounded-xl border p-6 text-left">
        <dl className="flex flex-col gap-4 text-[14px]">
          {session_id ? (
            <div>
              <dt className="text-muted text-[12px] tracking-[0.1em] uppercase">
                Order reference
              </dt>
              {/* The Stripe session id, which is what Damien searches on to
                  find the order, so it is the only reference worth printing.
                  break-all because it is long and must not overflow a 390px
                  screen. */}
              <dd className="text-ink mt-1 font-mono text-[13px] break-all">
                {session_id}
              </dd>
            </div>
          ) : null}
          {arrival ? (
            <div>
              <dt className="text-muted text-[12px] tracking-[0.1em] uppercase">
                Expected to arrive
              </dt>
              <dd className="text-ink mt-1">
                In {arrival}. We will email you when it is dispatched.
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-muted text-[12px] tracking-[0.1em] uppercase">
              What happens next
            </dt>
            <dd className="text-graphite mt-1 leading-relaxed">
              {email ? (
                <>
                  A confirmation should reach {email} shortly. If it has not
                  arrived within an hour, email us and quote the reference above
                  — the order is placed either way.
                </>
              ) : (
                <>
                  We will be in touch by email to confirm the order and arrange
                  delivery. Quote the reference above in anything you send us.
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted text-[12px] tracking-[0.1em] uppercase">
              Any questions
            </dt>
            <dd className="mt-1">
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-ink underline decoration-[0.5px] underline-offset-4"
              >
                {siteConfig.email}
              </a>
            </dd>
          </div>
        </dl>
      </div>

      <AppLink
        href="/shop"
        className="bg-ink text-canvas mt-8 inline-flex h-12 items-center justify-center rounded-lg px-8 text-[12px] font-semibold tracking-[0.14em] uppercase"
      >
        Continue Shopping
      </AppLink>
    </Container>
  );
}
