import "server-only";

/**
 * Pure formatting helpers for transactional email.
 *
 * Deliberately free of I/O, `env` and template markup so each one can be
 * pinned by a test — the money and lead-time rules below are the two things in
 * an order email that a customer will actually check against their bank
 * statement and their calendar.
 */

/** Stripe's shipping details, as stored on `orders.shipping_address`. */
export interface EmailAddress {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
}

/** One purchased line, as the email templates need it. */
export interface EmailLineItem {
  /** Product title as it was charged, from the Stripe line item. */
  description: string | null;
  quantity: number | null;
  /** Line total in minor units (pence), from Stripe. */
  amountTotal: number | null;
  /**
   * The product's own `deliveryLeadTime`, verbatim from Sanity. `null` means
   * "we do not know" — never a default, never a guess. See `describeLeadTime`.
   */
  leadTime: string | null;
  slug: string | null;
  sku: string | null;
  supplier: string | null;
  selectedOptions: Record<string, string> | null;
}

/**
 * Everything the order emails need, already resolved.
 *
 * Assembled once in ./order-email.ts so the customer's confirmation and the
 * owner's alert are built from one identical set of facts — the failure mode
 * worth designing out is a confirmation and an alert that disagree about what
 * was bought.
 */
export interface OrderEmailData {
  /**
   * `orders.id` — the order's UUID. Used verbatim as the customer-facing
   * reference because it is also the key for /track/<id> and
   * /admin/orders/<id>: a customer quoting it and the owner searching for it
   * are then talking about exactly the same string. No prettier short code is
   * derived from it, since a short code would match nothing in the database.
   */
  orderId: string;
  placedAt: Date;
  customerName: string | null;
  customerEmail: string;
  customerPhone: string | null;
  /** Order total in minor units, from Stripe. */
  amountTotal: number;
  currency: string;
  items: EmailLineItem[];
  shippingAddress: EmailAddress | null;
  /** Canonical site origin, no trailing slash. */
  siteUrl: string;
}

/**
 * Format a minor-unit amount (Stripe's `amount_total`) as currency.
 *
 * Stripe stores money in the currency's smallest unit, so 245000 is £2,450.00.
 * A malformed currency code falls back to GBP rather than throwing: `Intl`
 * rejects anything that isn't three letters, and an exception here would take
 * down the email for an order that has already been paid for.
 */
export function formatMoney(minorUnits: number, currency: string): string {
  const code = /^[a-z]{3}$/i.test(currency) ? currency.toUpperCase() : "GBP";
  const amount = (Number.isFinite(minorUnits) ? minorUnits : 0) / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** UK long date, e.g. "12 August 2026". */
export function formatEmailDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(date);
}

/** UK date and time, for the owner alert. e.g. "12 August 2026, 14:05". */
export function formatEmailDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London",
  }).format(date);
}

/**
 * Flatten a shipping address to display lines, dropping every empty field.
 * "GB" is omitted: a UK-only shop printing "GB" under a UK address is noise.
 */
export function formatAddressLines(
  address: EmailAddress | null | undefined,
): string[] {
  if (!address) return [];
  const parts = [
    address.name,
    address.address?.line1,
    address.address?.line2,
    address.address?.city,
    address.address?.state,
    address.address?.postal_code,
    address.address?.country === "GB" ? null : address.address?.country,
  ];
  return parts
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0);
}

/**
 * Turn a product's own lead time into a sentence fragment.
 *
 * A `null` lead time is stated as unknown rather than filled in. Lead times on
 * this catalogue come from the supplier's own page and are never rewritten (see
 * docs/product-page-style.md) — inventing "7-10 days" for a made-to-order
 * sauna is the kind of promise that turns one order into a refund and a
 * complaint.
 */
export function describeLeadTime(leadTime: string | null): string {
  const value = leadTime?.trim();
  if (!value) return "We will confirm the delivery window by email";
  return `Delivered in ${value}`;
}

/**
 * The single lead time to show for the whole order, or `null` if the order
 * needs a line-by-line breakdown instead.
 *
 * Returns a value only when every item is known *and* agrees. One unknown, or
 * two different windows, and the caller must show each item separately — a
 * basket holding a 2-week accessory and a 12-week cabin has no one answer.
 */
export function sharedLeadTime(items: EmailLineItem[]): string | null {
  if (items.length === 0) return null;
  const values = items.map((item) => item.leadTime?.trim() ?? "");
  if (values.some((value) => value.length === 0)) return null;
  return values.every((value) => value === values[0]) ? values[0]! : null;
}

/** "Qty 2" / "Qty 2 · Oak, 2.4m" — the quiet line under a product title. */
export function formatLineDetail(item: EmailLineItem): string[] {
  const detail: string[] = [`Qty ${item.quantity ?? 1}`];
  const options = item.selectedOptions
    ? Object.values(item.selectedOptions)
        .map((value) => value.trim())
        .filter(Boolean)
    : [];
  if (options.length > 0) detail.push(options.join(", "));
  return detail;
}

/**
 * Absolute URL for a path on the site. Emails cannot use relative links, and a
 * doubled or missing slash produces a dead link in the one message a customer
 * is most likely to click.
 */
export function absoluteUrl(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}
