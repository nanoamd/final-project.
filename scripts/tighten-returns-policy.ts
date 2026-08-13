/**
 * Rewrites the returns page for a multi-supplier dropship model.
 *
 * Damien: *"we will just be very picky with returns for hill interiors, if each
 * supplier has a different timeframe for returns I want everything saying it is
 * dependant on suppliers for all conditions, returns warranty etc"*.
 *
 * Warranty and delivery already say exactly that and are left alone — the warranty
 * page opens "Kaiku doesn't offer a separate warranty of its own — every product is
 * covered by whatever warranty its manufacturer or supplier provides, for the length
 * they specify", and the delivery page already states that pricing and timescales
 * vary by product and supplier. Nothing to change there.
 *
 * **Returns is different, and one part of the request cannot be done.** The
 * fourteen-day cancellation right comes from the Consumer Contracts (Information,
 * Cancellation and Additional Charges) Regulations 2013 and it attaches to the
 * contract between Kaiku and the customer. The customer has no contract with Hill
 * Interiors. So "your right to cancel depends on our supplier" would be an unfair
 * term, unenforceable if tested, and — the part that matters more here — it reads to
 * a shopper as a shop looking for a way out. On a site whose whole problem is
 * earning trust from strangers, that sentence costs more than the returns do.
 *
 * What *can* be made supplier-dependent, and is:
 *
 *   - **How a return is collected, and who arranges it.** Damien's decision, and
 *     lawful for a distance sale: the customer arranges and pays for a
 *     change-of-mind return. The Regulations permit that as long as it is disclosed
 *     before the contract is made, which the page does. It does **not** extend to
 *     faults — for those the trader bears the cost, so that section says so
 *     explicitly rather than leaving the customer-pays rule to bleed across.
 *   - **The return address is issued per return, never published.** Hill require the
 *     claim through their own form and issue a Return Confirmation Note that must
 *     travel with the goods; a parcel arriving at their warehouse without it can be
 *     refused. Publishing a standing returns address would lose customers' parcels.
 *   - **The window for reporting damage.** Hill allow three working days from
 *     delivery for a damaged or incorrect item; miss it and the claim is refused, so
 *     the customer has to tell us quickly. Asking for prompt notification of damage
 *     is ordinary and lawful.
 *   - **Warranty length and cover.** Already stated.
 *
 * And the lawful version of being picky, which is what Damien actually needs against
 * Hill's 50% restocking fee: the Regulations allow a trader to **reduce a refund
 * where the goods have been handled beyond what is necessary to examine them**. That
 * is a real protection and it is now stated plainly, along with the conditions —
 * unused, complete, original packaging, collected from the delivery address. Being
 * strict inside the law is defensible. Rewriting the right itself is not.
 *
 *   pnpm tsx --env-file=.env.local scripts/tighten-returns-policy.ts
 *   pnpm tsx --env-file=.env.local scripts/tighten-returns-policy.ts --apply
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "Change of mind",
    body:
      "If you change your mind, you can cancel within 14 days of receiving your " +
      "order, in line with UK consumer law. Items must be unused, complete with all " +
      "accessories and returned in their original packaging. Return shipping is paid " +
      "by the customer for change-of-mind returns. Where an item has been handled " +
      "beyond what is needed to examine it, we may reduce the refund to reflect the " +
      "loss in value.",
  },
  {
    heading: "Arranging a change-of-mind return",
    body:
      "For change-of-mind returns you arrange and pay for the return yourself, " +
      "which keeps our prices lower than they would otherwise be. Contact us first " +
      "and we'll send you the correct return address for your item, together with " +
      "the reference the warehouse needs and, where it helps, the details of a " +
      "courier who will collect. Please don't send anything back before we've given " +
      "you that reference — every product ships from the supplier who makes or holds " +
      "it, and an unannounced delivery to their warehouse can be refused.",
  },
  {
    heading: "Faulty, damaged or incorrect items",
    body:
      "Tell us within 48 hours of delivery if an item arrives faulty, damaged or " +
      "incorrect, and send photographs if you can. Reporting quickly matters: our " +
      "suppliers set their own windows for damage claims, and some are as short as " +
      "three working days from delivery. We arrange and cover the cost of return " +
      "shipping in these cases — you are never out of pocket for a fault — and " +
      "depending on the situation we'll offer a repair, replacement parts, a " +
      "replacement or a full refund.",
  },
  {
    heading: "Made-to-order products",
    body:
      "Once a made-to-order item has entered production, it can no longer be " +
      "cancelled unless required by law. Please make sure your specification is " +
      "confirmed before production begins.",
  },
  {
    heading: "How refunds work",
    body:
      "Refunds are issued to your original payment method as quickly as possible " +
      "once the returned item has been received and inspected. To start a return, " +
      "contact us with your order number and we'll guide you through the next steps.",
  },
];

function block(style: "h2" | "normal", text: string, key: string) {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

async function main() {
  const page = await client.fetch<{ _id: string; title: string } | null>(
    `*[_type == "page" && slug.current == "returns"][0]{ _id, title }`,
  );
  if (!page) {
    console.error("✗ No page with slug 'returns' — aborting.");
    process.exit(1);
  }

  const body = SECTIONS.flatMap((section, index) => [
    block("h2", section.heading, `rh${index}`),
    block("normal", section.body, `rb${index}`),
  ]);

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — ${page._id}\n`);
  for (const section of SECTIONS) {
    console.log(`  ## ${section.heading}`);
    console.log(`     ${section.body.slice(0, 150)}…\n`);
  }

  console.log(
    "Unchanged deliberately: the 14-day cancellation right is not made\n" +
      "supplier-dependent. It is a statutory right in the contract between Kaiku and\n" +
      "the customer, who has no contract with the supplier — so varying it by supplier\n" +
      "would be unenforceable, and it would read to a shopper as a shop hunting for an\n" +
      "excuse. What varies by supplier is collection, timescales, damage windows and\n" +
      "warranty, all of which now say so.\n",
  );

  if (!apply) {
    console.log("Dry run — nothing written. Re-run with --apply.\n");
    return;
  }

  await client.patch(page._id).set({ body }).commit();
  console.log("Returns page updated.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
