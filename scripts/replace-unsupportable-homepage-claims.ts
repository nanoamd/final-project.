/**
 * Replaces the two homepage claims the business cannot support.
 *
 * Both are the same class of problem as the seeded star ratings: copy written to
 * fill a slot, describing a shop that does not exist yet.
 *
 *   trustBarItems[t1]  "Premium Delivery — White glove delivery across the UK"
 *
 *     White glove means two people, into the room, unpacked, packaging taken
 *     away. Delivery here is a courier parcel at £2.79-£5.99 (see
 *     aw-dropship-shipping.ts) or a pallet for the saunas. "Across the UK" is
 *     also wrong twice over: checkout is GB-only
 *     (shipping_address_collection in checkout.ts) and the delivery notes on
 *     every product say Highlands, islands and Northern Ireland may cost more or
 *     take longer.
 *
 *     Replaced with free delivery, which is true, verifiable in one click, and a
 *     stronger claim anyway — createCheckoutSession offers a single £0 shipping
 *     option on every basket, and json-ld.tsx declares £0 to Google. "UK
 *     mainland" matches the wording already in the product delivery notes.
 *
 *   designedForLivingCards[c3]  "Trusted by Thousands — Rated excellent by our customers"
 *
 *     Draft only; the published card already reads "Honest Specification". But
 *     publishing the draft would put it live, and there have been no customers at
 *     all, so there is nobody to be rated by and nobody to be trusted by. Under
 *     the DMCC Act 2024 an implied review claim with no reviews behind it is
 *     enforceable directly by the CMA.
 *
 *     The slot wants social proof, and social proof is the one thing a shop with
 *     no orders cannot have. Rather than invent a replacement, the draft is set
 *     back to whatever the published card says — "Honest Specification", which is
 *     true, is already live, and is already approved by virtue of being there.
 *     Copied from the published document rather than hardcoded, so this stays
 *     right if the live wording changes later.
 *
 * The two claims are therefore handled differently on purpose. White glove is
 * live and wrong, so it changes in both documents. Trusted by Thousands is draft
 * only — the live card is fine, and overwriting good published copy to fix an
 * unpublished edit would be the wrong way round.
 *
 * Leaves t4 ("Expert Support — Our team is here to help you every step") alone:
 * it was not part of the brief. Worth a look during the Sanity pass though —
 * "our team" is one person, and phone support is explicitly not on offer.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/replace-unsupportable-homepage-claims.ts
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

/** Keyed by the array item's _key, which is stable across both documents. */
const TRUST_BAR: Record<string, { title: string; copy: string }> = {
  t1: {
    title: "Free Delivery",
    copy: "UK mainland delivery included in every price",
  },
};

/** The card the draft must not regress. Its wording comes from the live doc. */
const CARD_TO_MATCH_PUBLISHED = "c3";

interface Item {
  _key: string;
  title: string | null;
  copy: string | null;
}

async function main() {
  let written = 0;

  // Read the published card first — it is the source of truth for the draft.
  const published = await client.fetch<Item[] | null>(
    `*[_id=="homepage"][0].designedForLivingCards[]{_key, title, copy}`,
  );
  const liveCard = (published ?? []).find(
    (c) => c._key === CARD_TO_MATCH_PUBLISHED,
  );
  if (!liveCard?.title || !liveCard.copy) {
    console.error(
      `The published homepage has no usable designedForLivingCards[${CARD_TO_MATCH_PUBLISHED}] to copy — aborting.`,
    );
    process.exit(1);
  }

  for (const id of ["homepage", "drafts.homepage"]) {
    const doc = await client.fetch<{
      trust: Item[] | null;
      cards: Item[] | null;
    } | null>(
      `*[_id==$id][0]{
        "trust": trustBarItems[]{_key, title, copy},
        "cards": designedForLivingCards[]{_key, title, copy}
      }`,
      { id },
    );
    if (!doc) {
      console.log(`· ${id}: does not exist — skipped`);
      continue;
    }

    const patch: Record<string, string> = {};
    const describe: string[] = [];

    const plan = [
      { field: "trustBarItems", items: doc.trust ?? [], want: TRUST_BAR },
      {
        field: "designedForLivingCards",
        items: doc.cards ?? [],
        // Only the draft needs this; on the published document it is a no-op,
        // because the value being written is the published document's own.
        want: {
          [CARD_TO_MATCH_PUBLISHED]: {
            title: liveCard.title!,
            copy: liveCard.copy!,
          },
        },
      },
    ];

    for (const { field, items, want } of plan) {
      for (const [key, replacement] of Object.entries(want)) {
        const index = items.findIndex((i) => i._key === key);
        if (index === -1) {
          console.warn(`  ⚠ ${id}: no ${field} item with _key "${key}"`);
          continue;
        }
        const current = items[index]!;
        if (
          current.title === replacement.title &&
          current.copy === replacement.copy
        ) {
          describe.push(`  = ${field}[${key}] already correct`);
          continue;
        }
        // Addressed by _key, not by index: the two documents could reorder
        // independently, and an index would then patch the wrong card.
        patch[`${field}[_key=="${key}"].title`] = replacement.title;
        patch[`${field}[_key=="${key}"].copy`] = replacement.copy;
        describe.push(
          `  ${field}[${key}]\n` +
            `      was:  ${current.title} — ${current.copy}\n` +
            `      now:  ${replacement.title} — ${replacement.copy}`,
        );
      }
    }

    console.log(`\n===== ${id}`);
    console.log(describe.join("\n") || "  nothing to change");

    if (!Object.keys(patch).length) continue;
    if (apply) await client.patch(id).set(patch).commit();
    written++;
  }

  console.log(
    `\n${written} document(s) ${apply ? "updated" : "to update"}.` +
      (apply ? "\n" : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("replace-unsupportable-homepage-claims failed:", err);
  process.exit(1);
});
