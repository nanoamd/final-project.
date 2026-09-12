/**
 * Repairs the duplicate titles that `fix-meta-titles.ts` introduced.
 *
 * Shortening dropped the trailing "with …" clause, which is usually the right
 * call and was occasionally the worst possible one: on a range whose variants
 * differ *only* inside that clause, it collapsed them into one title.
 *
 *   Freska Ribbed Round Glass Jar with Acacia Wood Lid 1100ml
 *   Freska Ribbed Round Glass Jar with Acacia Wood Lid 800ml
 *   Freska Ribbed Round Glass Jar with Acacia Wood Lid 550ml
 *
 * all became "Freska Ribbed Round Glass Jar | Kaiku". Two pages sharing a
 * title is worse than one Google truncates, because Google folds them
 * together and drops one — the site had **zero** duplicate titles before this
 * and three groups covering eight pages after, which is a regression, not a
 * trade-off.
 *
 * For every colliding group this retries with the "with …" clause kept, which
 * preserves the distinguishing part. Where that still collides or still will
 * not fit, the override is removed entirely and the product goes back to its
 * own title — Google truncating a correct, unique title is the better failure.
 *
 *   pnpm tsx --env-file=.env.local scripts/repair-duplicate-meta-titles.ts
 *   pnpm tsx --env-file=.env.local scripts/repair-duplicate-meta-titles.ts --apply
 */
import { createClient } from "@sanity/client";

import { shortenMetaTitle } from "@/lib/catalog/meta-title";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
  perspective: "raw",
});

interface Row {
  _id: string;
  slug: string;
  title: string;
  metaTitle: string | null;
}

const key = (value: string) => value.trim().toLowerCase();

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="product" && !(_id in path("drafts.**")) && defined(slug.current)]{
      _id, "slug": slug.current, title, "metaTitle": seo.metaTitle }`,
  );

  const effective = new Map<string, Row[]>();
  for (const row of rows) {
    const value = key(row.metaTitle?.trim() || row.title);
    effective.set(value, [...(effective.get(value) ?? []), row]);
  }

  const collisions = [...effective.entries()].filter(
    ([, group]) => group.length > 1,
  );

  if (!collisions.length) {
    console.log("\nNo duplicate product titles. Nothing to repair.");
    return;
  }

  console.log(
    `\n${collisions.length} duplicate title group(s), ${collisions.reduce((n, [, g]) => n + g.length, 0)} pages.\n`,
  );

  // Titles already in use by a product that is not part of this repair.
  const taken = new Set(
    [...effective.entries()]
      .filter(([, group]) => group.length === 1)
      .map(([value]) => value),
  );

  const repairs: { row: Row; value: string | null; reason: string }[] = [];

  /** Words in this title that at least one sibling does not have. */
  const distinguishing = (row: Row, group: Row[]): string[] => {
    const tokens = (value: string) =>
      new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
    const mine = tokens(row.title);
    const siblings = group
      .filter((other) => other._id !== row._id)
      .map((other) => tokens(other.title));
    return [...mine].filter((word) =>
      siblings.some((other) => !other.has(word)),
    );
  };

  for (const [value, group] of collisions) {
    console.log(`  "${value}" — ${group.length} pages`);
    for (const row of group) {
      // Retry from the product's own title, keeping the clause that
      // distinguishes it.
      const retry = shortenMetaTitle(row.title, undefined, {
        keepWithClause: true,
      });

      /**
       * A retry is only worth taking if it still carries what makes this
       * product different from its siblings. "Goa … Double Hanging Chair With
       * Grey Cushions" shortened to "Black Rattan Effect Double Hanging Chair"
       * is unique but says nothing about cushions, which is a worse title than
       * the long one it replaced.
       */
      const needed = distinguishing(row, group);
      const candidateText = retry.value.toLowerCase();
      const keepsMeaning = needed.every((word) => candidateText.includes(word));
      const candidate = retry.unsafe || !keepsMeaning ? null : retry.value;

      if (!keepsMeaning && !retry.unsafe) {
        console.log(
          `     (retry dropped: ${needed.filter((w) => !candidateText.includes(w)).join(", ")})`,
        );
      }

      if (candidate && !taken.has(key(candidate))) {
        taken.add(key(candidate));
        repairs.push({ row, value: candidate, reason: "kept the with-clause" });
        console.log(`     ${row.slug}`);
        console.log(`       -> ${candidate}`);
      } else {
        // No unique shortening exists. Remove the override and let the
        // product's own unique title stand.
        taken.add(key(row.title));
        repairs.push({ row, value: null, reason: "override removed" });
        console.log(`     ${row.slug}`);
        console.log(`       -> (override removed, reverts to its own title)`);
      }
    }
    console.log("");
  }

  if (!apply) {
    console.log("Dry run — re-run with --apply.");
    return;
  }

  for (const repair of repairs) {
    if (repair.value) {
      await client
        .patch(repair.row._id)
        .set({ "seo.metaTitle": repair.value })
        .commit();
    } else {
      await client.patch(repair.row._id).unset(["seo.metaTitle"]).commit();
    }
  }
  console.log(`Repaired ${repairs.length} titles.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
