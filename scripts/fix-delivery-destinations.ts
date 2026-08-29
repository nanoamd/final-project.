/**
 * Corrects the Delivery page, which promises shipping we cannot do.
 *
 * It currently reads:
 *
 *   "We deliver across the UK, and further afield wherever our suppliers are
 *    able to fulfil an order. Availability and delivery pricing vary by
 *    product, destination and the delivery option you choose at checkout."
 *
 * Checkout does not offer a destination. `src/server/actions/checkout.ts` sets
 * `shipping_address_collection: { allowed_countries: ["GB"] }`, so a customer
 * anywhere else can browse the catalogue, fill a basket, and be refused at the
 * address step with no warning — having been told on this very page that we
 * ship further afield.
 *
 * This came out of Damien asking whether the banner should say "uk shipping
 * only". The banner was the wrong place for it; this was the right one, and it
 * was saying the opposite.
 *
 * Replaces that one paragraph and leaves the rest of the page alone. If the
 * paragraph has since been edited by hand the script reports it and changes
 * nothing, rather than overwriting an editor.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-delivery-destinations.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-delivery-destinations.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

/** The sentence that is not true. Matched loosely enough to survive a comma. */
const WRONG = /further afield/i;

const CORRECTED =
  "We deliver anywhere in the United Kingdom. We are not able to ship outside the UK at the moment, so checkout will only accept a UK address. Delivery timings vary by product and are shown on each product page.";

interface Block {
  _type?: string;
  _key?: string;
  children?: { text?: string }[];
  [key: string]: unknown;
}

async function main() {
  const page = await client.fetch<{ _id: string; body?: Block[] } | null>(
    `*[_type == "page" && slug.current == "delivery"][0]{ _id, body }`,
  );

  if (!page) {
    console.log("No delivery page found.");
    return;
  }

  const body = page.body ?? [];
  const index = body.findIndex((block) =>
    (block.children ?? []).some((child) => WRONG.test(child.text ?? "")),
  );

  if (index === -1) {
    console.log(
      "The 'further afield' paragraph is not there any more — nothing to change.",
    );
    return;
  }

  const before = (body[index]!.children ?? [])
    .map((child) => child.text ?? "")
    .join("");

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — delivery destinations\n`);
  console.log(`  was: ${before}`);
  console.log(`  now: ${CORRECTED}`);

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }

  const next = body.map((block, position) =>
    position === index
      ? {
          ...block,
          children: [
            {
              _type: "span",
              _key: `${block._key ?? "delivery"}-0`,
              text: CORRECTED,
              marks: [],
            },
          ],
        }
      : block,
  );

  await client.patch(page._id).set({ body: next }).commit();
  console.log("\nDelivery page updated.");
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;

if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
