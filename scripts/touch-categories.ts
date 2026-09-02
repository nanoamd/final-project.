/**
 * Bumps every category document without changing a single value.
 *
 * Damien's Studio is showing "Empty" for SEO introduction and Buying guidance on
 * categories that demonstrably hold both — verified repeatedly against the live
 * dataset with an uncached client: 49 category documents, 0 drafts, 0 with an
 * empty intro or buyingGuide. So the content is stored; his open tab is not
 * showing what is stored.
 *
 * Studio keeps a real-time listener on the documents it has open and re-renders
 * when a mutation arrives. Setting each field to the value it already has emits
 * that mutation, which is the one thing that can refresh a stale tab from this
 * side without him doing anything.
 *
 * Nothing here changes content. Every set is the document's own current value,
 * read immediately before it is written back.
 *
 *   pnpm tsx --env-file=.env.local scripts/touch-categories.ts
 *   pnpm tsx --env-file=.env.local scripts/touch-categories.ts --apply
 */
import { createClient } from "@sanity/client";

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
});

async function main() {
  const cats = await client.fetch<
    {
      _id: string;
      title: string;
      intro?: unknown[];
      buyingGuide?: unknown[];
      faqs?: unknown[];
    }[]
  >(
    `*[_type=="category" && !(_id in path("drafts.**"))]{_id,title,intro,buyingGuide,faqs}`,
  );

  const transaction = client.transaction();
  let queued = 0;
  let short = 0;

  for (const c of cats) {
    const introN = c.intro?.length ?? 0;
    const guideN = c.buyingGuide?.length ?? 0;
    const faqN = c.faqs?.length ?? 0;
    if (introN === 0 || guideN === 0) {
      console.error(`STILL EMPTY: ${c._id} — ${c.title}`);
      short += 1;
      continue;
    }
    console.log(
      `${c._id.padEnd(36)} intro=${introN} guide=${guideN} faqs=${faqN}  ${c.title}`,
    );
    if (apply) {
      // Written back exactly as read. This is a no-op to the content and a
      // mutation event to any Studio tab with the document open.
      transaction.patch(c._id, (p) =>
        p.set({
          intro: c.intro,
          buyingGuide: c.buyingGuide,
          ...(faqN ? { faqs: c.faqs } : {}),
        }),
      );
      queued += 1;
    }
  }

  console.log(`\nCategories: ${cats.length}`);
  console.log(`With intro and buying guidance: ${cats.length - short}`);
  console.log(`Empty: ${short}`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`Touched ${queued} documents (no content changed).`);
  } else if (!apply) {
    console.log("Dry run — pass --apply to emit the no-op mutations.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
