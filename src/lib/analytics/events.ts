/**
 * The four things worth knowing a visitor did, reported to GA4 and Meta at once.
 *
 * **Before this, neither reported anything.** Both tags fired a page view and stopped
 * there — no `view_item`, no `add_to_cart`, no `purchase`. Three consequences, and each
 * one is a reason a paid campaign would have wasted money:
 *
 *   - **GA4 could never record a conversion.** It would report sessions and bounce
 *     rate and never once say that anybody bought anything, so there was no way to
 *     know what a session was worth.
 *   - **Meta could not optimise for sales**, because optimising for a conversion
 *     requires the conversion to be reported. It would have optimised for clicks, and
 *     clicks are not the thing.
 *   - **Catalogue retargeting was impossible.** Showing somebody the exact table they
 *     looked at is the highest-return format in furniture advertising, and it needs
 *     `ViewContent` carrying the product's ID. Without it the only audience available
 *     is "everyone who visited", which is the blunt, expensive version.
 *
 * So the pixel is worth installing *before* any money is spent: it costs nothing and
 * starts building the audience and the history that make the first campaign work.
 *
 * **Content IDs are the product slug** — the same value the Google Merchant feed uses
 * as `id`. Keeping one identifier across GA4, Meta and Merchant Centre is what lets a
 * product be matched to itself across all three; two schemes would silently produce
 * three sets of unmatched data.
 *
 * Everything here fails silent. An analytics call must never break a checkout, and a
 * visitor who declined cookies has no `gtag` or `fbq` on the page at all — see the
 * consent gate in the tag components.
 */

/** GBP throughout: the store prices in one currency and Stripe charges in it. */
const CURRENCY = "GBP";

export interface AnalyticsItem {
  slug: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
}

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

function gtag(): Gtag | null {
  if (typeof window === "undefined") return null;
  const fn = (window as unknown as { gtag?: Gtag }).gtag;
  return typeof fn === "function" ? fn : null;
}

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fn = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fn === "function" ? fn : null;
}

function ga4Items(items: AnalyticsItem[]) {
  return items.map((item) => ({
    item_id: item.slug,
    item_name: item.name,
    item_category: item.category,
    price: item.price,
    quantity: item.quantity ?? 1,
    currency: CURRENCY,
  }));
}

function total(items: AnalyticsItem[]) {
  return items.reduce(
    (sum, item) => sum + item.price * (item.quantity ?? 1),
    0,
  );
}

/**
 * Rounded to pence before it is sent.
 *
 * A float like 1049.9999999999998 in a revenue field is the kind of thing that
 * reconciles against Stripe to the penny in every report except the one somebody
 * eventually queries.
 */
function money(value: number) {
  return Math.round(value * 100) / 100;
}

/** Somebody looked at a product page. */
export function trackViewItem(item: AnalyticsItem) {
  const items = [item];
  gtag()?.("event", "view_item", {
    currency: CURRENCY,
    value: money(total(items)),
    items: ga4Items(items),
  });
  fbq()?.("track", "ViewContent", {
    content_type: "product",
    content_ids: [item.slug],
    content_name: item.name,
    value: money(item.price),
    currency: CURRENCY,
  });
}

/** Somebody added something to the basket. */
export function trackAddToCart(item: AnalyticsItem) {
  const items = [item];
  gtag()?.("event", "add_to_cart", {
    currency: CURRENCY,
    value: money(total(items)),
    items: ga4Items(items),
  });
  fbq()?.("track", "AddToCart", {
    content_type: "product",
    content_ids: [item.slug],
    content_name: item.name,
    value: money(total(items)),
    currency: CURRENCY,
  });
}

/** Somebody started checkout. The last step we see before Stripe takes over. */
export function trackBeginCheckout(items: AnalyticsItem[]) {
  if (!items.length) return;
  gtag()?.("event", "begin_checkout", {
    currency: CURRENCY,
    value: money(total(items)),
    items: ga4Items(items),
  });
  fbq()?.("track", "InitiateCheckout", {
    content_type: "product",
    content_ids: items.map((item) => item.slug),
    num_items: items.reduce((n, item) => n + (item.quantity ?? 1), 0),
    value: money(total(items)),
    currency: CURRENCY,
  });
}

/**
 * Somebody bought something.
 *
 * `orderId` is passed as the transaction ID so a refresh of the success page does not
 * count a second sale — both platforms de-duplicate on it. Without it, one customer
 * reloading the page turns £1,050 of revenue into £2,100 in the report, and every
 * decision made from that number is wrong.
 */
export function trackPurchase({
  orderId,
  items,
  value,
  shipping,
}: {
  orderId: string;
  items: AnalyticsItem[];
  /** The amount actually charged, when known — otherwise the lines are summed. */
  value?: number;
  shipping?: number;
}) {
  const revenue = money(value ?? total(items));
  gtag()?.("event", "purchase", {
    transaction_id: orderId,
    currency: CURRENCY,
    value: revenue,
    shipping: shipping !== undefined ? money(shipping) : undefined,
    items: ga4Items(items),
  });
  fbq()?.(
    "track",
    "Purchase",
    {
      content_type: "product",
      content_ids: items.map((item) => item.slug),
      num_items: items.reduce((n, item) => n + (item.quantity ?? 1), 0),
      value: revenue,
      currency: CURRENCY,
    },
    { eventID: orderId },
  );
}
