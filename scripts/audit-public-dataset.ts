/**
 * What a stranger can read out of the Sanity dataset without a token.
 *
 * ## Why this exists
 *
 * `src/lib/sanity/config.ts` has long recorded that a tokenless GROQ query
 * against this project returns HTTP 200 with the real catalogue, and treated
 * that as acceptable because the catalogue is public by design. It is. The
 * mistake was never checking what else shares the dataset.
 *
 * Found 25 October, unauthenticated, from outside:
 *
 *   costPrice and shippingCost on every product, with the supplier named
 *   contactSubmission documents  — real names, email addresses, messages
 *   newsletterSubscriber documents — real email addresses
 *
 * The project ID is not a secret and cannot be one: it appears in every
 * `cdn.sanity.io/images/huh1e45n/production/…` URL the site serves, so anyone
 * who views source has it. The dataset being public is what makes it matter.
 *
 * Two consequences, in order of seriousness:
 *
 *  1. **Personal data.** Ten records with email addresses, world-readable.
 *     That is a UK GDPR matter, not a competitive one.
 *  2. **Trade prices.** Hill Interiors' and Premier Housewares' cost to Kaiku,
 *     per product, published. Any competitor can read Kaiku's margin on
 *     everything, and Kaiku's suppliers can read what it resells at.
 *
 * Note what this means for the care taken elsewhere: `getRailMarkupIndex()`
 * computes its markup ratio inside GROQ specifically so a cost price never
 * reaches the browser. That was correct and it was beside the point, because
 * the whole cost table was one anonymous HTTP request away.
 *
 * ## The fix, in order
 *
 *  1. Deploy a `SANITY_API_READ_TOKEN` (Viewer role) to Vercel. Harmless while
 *     the dataset is still public — `src/lib/sanity/client.ts` just passes it.
 *  2. Sanity → project → API → Datasets → set `production` to **private**.
 *  3. Run this script again. Every line should read CLOSED.
 *
 * Doing it in that order means no window where the site has no content.
 *
 * Moving the form submissions out of Sanity altogether is the better long-term
 * answer — a CMS dataset is not where customer records belong, and Supabase
 * already has `subscribers` and `tickets` tables — but that is a migration,
 * and private is correct regardless.
 *
 * ## Running it
 *
 *   pnpm tsx scripts/audit-public-dataset.ts
 *
 * No credentials, by design: it asks the question a stranger would ask. It is
 * read-only, it never writes, and **it deliberately prints counts and field
 * names only, never a name, an address or a message body.**
 */
const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n";
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const API = "2025-01-01";

const endpoint = `https://${PROJECT_ID}.api.sanity.io/v${API}/data/query/${DATASET}`;

/** Runs a GROQ query with no credentials at all. */
async function anon(query: string): Promise<unknown> {
  const res = await fetch(`${endpoint}?query=${encodeURIComponent(query)}`);
  if (res.status === 401 || res.status === 403) return "UNAUTHORIZED";
  if (!res.ok) throw new Error(`${res.status} from ${PROJECT_ID}/${DATASET}`);
  return (await res.json()).result;
}

export interface Check {
  label: string;
  query: string;
  /** What an exposed result means, in one line. */
  meaning: string;
}

const CHECKS: Check[] = [
  {
    label: "Products with a cost price readable",
    query: 'count(*[_type=="product" && defined(costPrice)])',
    meaning: "trade cost per product, and therefore Kaiku's margin",
  },
  {
    label: "Products with a carriage cost readable",
    query: 'count(*[_type=="product" && defined(shippingCost)])',
    meaning: "what each supplier charges Kaiku to ship",
  },
  {
    label: "Newsletter subscribers readable",
    query: 'count(*[_type=="newsletterSubscriber"])',
    meaning: "PERSONAL DATA — email addresses",
  },
  {
    label: "Contact submissions readable",
    query: 'count(*[_type=="contactSubmission"])',
    meaning: "PERSONAL DATA — names, email addresses, message bodies",
  },
  {
    label: "Supplier records readable",
    query: 'count(*[_type=="supplier"])',
    meaning: "supplier names, terms and internal notes",
  },
  {
    label: "Price adjustments readable",
    query: 'count(*[_type=="priceAdjustment"])',
    meaning: "the pricing history behind every product",
  },
];

async function main() {
  console.log(`Querying ${PROJECT_ID}/${DATASET} with no credentials.\n`);

  const reachable = await anon("count(*[_type=='product'])");
  if (reachable === "UNAUTHORIZED") {
    console.log(
      "The dataset refuses anonymous reads. Everything below is CLOSED.",
    );
    console.log("\nIf the site is also serving no content, the read token is");
    console.log("missing from the deployment — deploy it before leaving this.");
    return;
  }

  let open = 0;
  let personal = 0;

  for (const check of CHECKS) {
    const result = await anon(check.query);
    const n = typeof result === "number" ? result : 0;
    const exposed = result !== "UNAUTHORIZED" && n > 0;
    if (exposed) {
      open += 1;
      if (check.meaning.startsWith("PERSONAL DATA")) personal += n;
    }
    console.log(
      `  ${exposed ? "OPEN  " : "CLOSED"}  ${String(n).padStart(4)}  ${check.label}`,
    );
    if (exposed) console.log(`                  ^ ${check.meaning}`);
  }

  // Field names, not values. Enough to show the shape of what is exposed
  // without putting anybody's address into a terminal or a log file.
  const sample = await anon('*[_type=="contactSubmission"][0]');
  if (sample && typeof sample === "object") {
    console.log(
      `\n  Fields on an exposed contact submission: ${Object.keys(sample).sort().join(", ")}`,
    );
    console.log("  (names only — this script never prints their values)");
  }

  console.log(
    `\n${open} of ${CHECKS.length} checks OPEN. ${personal} records carrying personal data are world-readable.`,
  );
  if (open > 0) {
    console.log("\nFix, in this order so the site never goes contentless:");
    console.log("  1. Deploy SANITY_API_READ_TOKEN (Viewer) to Vercel");
    console.log("  2. Sanity -> API -> Datasets -> set this dataset private");
    console.log("  3. Run this again; every line should read CLOSED");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
