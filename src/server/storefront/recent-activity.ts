import "server-only";

import { sanityFetch } from "@/lib/sanity/fetch";
import { createAdminClient } from "@/server/supabase/admin";

/**
 * What the live activity feed shows, and where it comes from.
 *
 * Damien asked for the widget every shop has: a note in the corner saying
 * somebody just bought something, with a green light to say it is live. The
 * usual implementation invents the names and the purchases. This one does not,
 * for a reason that has nothing to do with Kaiku's own risk: a shopper reading
 * "Laura in Leeds bought this four minutes ago" is being told a fact, and
 * deciding to buy partly because of it. Inventing that fact deceives them, not
 * us, and they get no say in the risk.
 *
 * So the feed has two real sources and falls through them:
 *
 *   1. ORDERS. Real paid orders, newest first. This is the version Damien
 *      actually wants and it switches itself on the moment the first order
 *      lands — no code change, no flag.
 *   2. ARRIVALS. Products genuinely added to the catalogue in the last
 *      fortnight, for while the orders table is empty.
 *
 * With neither, the feed renders nothing. An empty shop stays quiet rather
 * than lying about it.
 *
 * WHAT IS EXPOSED, AND WHAT IS NOT. Orders carry a real customer's real
 * details, so this deliberately takes the narrowest slice that still reads as
 * a person: FIRST NAME ONLY and the town. Never the surname, the email, the
 * street, the postcode or the order value. That is still personal data shown
 * to strangers, so it needs a line in the privacy policy before the first
 * order ships — see the ledger.
 */
export interface ActivityItem {
  /** Stable across polls, so the client can avoid repeating one. */
  id: string;
  kind: "order" | "arrival";
  /** First name only, and only on orders. */
  name: string | null;
  /** Town only, and only on orders. */
  place: string | null;
  product: string;
  href: string | null;
  /** ISO timestamp — the client renders "4 minutes ago" from it. */
  at: string;
}

/** How far back an order still counts as news. */
const ORDER_WINDOW_DAYS = 30;

/**
 * How far back a product still counts as newly added — and why it is short.
 *
 * 895 of the 907 products in the catalogue were created within 45 days of
 * writing, because that is when the catalogue was built, not because they are
 * new arrivals. A wide window would therefore have called almost the entire
 * shop "just added": true of the database and false of the shop. A fortnight
 * only catches a batch somebody actually added.
 */
const ARRIVAL_WINDOW_DAYS = 14;

/**
 * Below this many, the arrivals feed stays dark.
 *
 * One item repeating every ten seconds is not a live feed, it is a stuck
 * ticker, and it reads as filler — which costs more trust than the widget
 * earns. A single real order is different and always shows: one sale is news
 * in a way one restock is not.
 */
const MIN_ARRIVALS = 3;

const MAX_ITEMS = 12;

/**
 * "Laura McCormack" -> "Laura". "laura" -> "Laura".
 *
 * Returns null rather than guessing when there is nothing usable, because a
 * blank name in the middle of the sentence is worse than no sentence.
 */
function firstName(full: string | null | undefined): string | null {
  const first = (full ?? "").trim().split(/\s+/)[0];
  if (!first || first.length < 2) return null;
  return first[0]!.toUpperCase() + first.slice(1).toLowerCase();
}

interface OrderRow {
  id: string;
  created_at: string;
  shipping_address: {
    name?: string | null;
    address?: { city?: string | null } | null;
  } | null;
  line_items: {
    description?: string | null;
    slug?: string | null;
    category?: string | null;
  }[];
}

async function recentOrders(): Promise<ActivityItem[]> {
  // Service role: `orders` is behind RLS that scopes rows to their own
  // customer, which is correct and is not what this needs. The projection
  // below is the whole reason that is safe — three columns, and only a first
  // name and a town survive into the response.
  let supabase;
  try {
    supabase = createAdminClient();
  } catch {
    // No service-role key configured (local dev, previews). Not an error: the
    // feed falls through to arrivals.
    return [];
  }

  const since = new Date(
    Date.now() - ORDER_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, shipping_address, line_items")
    .eq("status", "paid")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(MAX_ITEMS);

  if (error || !data) return [];

  const items: ActivityItem[] = [];
  for (const row of data as OrderRow[]) {
    const line = (row.line_items ?? []).find((li) => li.description);
    if (!line?.description) continue;
    items.push({
      id: `order-${row.id}`,
      kind: "order",
      name: firstName(row.shipping_address?.name),
      place: row.shipping_address?.address?.city?.trim() || null,
      product: line.description.replace(" | Kaiku", ""),
      href:
        line.slug && line.category
          ? `/shop/${line.category}/${line.slug}`
          : null,
      at: row.created_at,
    });
  }
  return items;
}

const ARRIVALS_QUERY = /* groq */ `
*[_type == "product"
  && !(_id in path("drafts.**"))
  && defined(slug.current)
  && defined(category->slug.current)
  && _createdAt > $since]
  | order(_createdAt desc)
  [0...$limit]{
    _id, title, _createdAt,
    "slug": slug.current,
    "category": category->slug.current
  }`;

interface ArrivalRow {
  _id: string;
  title: string;
  _createdAt: string;
  slug: string;
  category: string;
}

async function recentArrivals(): Promise<ActivityItem[]> {
  const since = new Date(
    Date.now() - ARRIVAL_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
  const rows = await sanityFetch<ArrivalRow[]>(
    ARRIVALS_QUERY,
    { since, limit: MAX_ITEMS },
    [],
  );
  if (rows.length < MIN_ARRIVALS) return [];
  return rows.map((row) => ({
    id: `arrival-${row._id}`,
    kind: "arrival" as const,
    name: null,
    place: null,
    product: row.title.replace(" | Kaiku", ""),
    href: `/shop/${row.category}/${row.slug}`,
    at: row._createdAt,
  }));
}

/**
 * Orders if there are any, otherwise arrivals, otherwise nothing.
 *
 * Not a merge of the two. Mixing "somebody bought this" with "we added this"
 * in one rotating strip invites a reader to take the second for the first,
 * which is the deception this was built to avoid, taking the long way round.
 */
export async function getRecentActivity(): Promise<ActivityItem[]> {
  const orders = await recentOrders();
  if (orders.length) return orders;
  return recentArrivals();
}
