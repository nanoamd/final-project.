/**
 * Closes the FAQ half of the "admits a gap" problem. The description-body
 * half was fixed in fix-gap-decimal-published-batch1/2.ts; re-checking the
 * full `everyField` scope quality.ts actually scores (summary + description
 * + faqs) found the same pattern sitting in 75 FAQ answers across ~68
 * published products that the description-only check never looked at.
 *
 * Two rules, same discipline as every other fix this session — never
 * fabricate an answer, never leave a heading/question promising information
 * the copy doesn't have:
 *
 *   - DELETES: the answer's only content is the admission itself (or the
 *     admission plus a referral to "contact customer support", which isn't
 *     an answer either). The question is removed entirely — an FAQ that
 *     exists only to say "we don't know" gives a shopper nothing and reads
 *     worse than not answering at all.
 *   - REPLACES: the answer contains a real fact or genuinely useful generic
 *     advice (source fixings separately, store cushions dry, a bulb isn't
 *     included) sitting alongside the hedge clause. Keeps only that part,
 *     rephrased to stand on its own without the "the specifications do not
 *     mention" framing.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-faq-gap-admissions-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-faq-gap-admissions-batch1.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

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

/** Matched by a substring of the question text — case-sensitive, taken
 * verbatim from the live FAQ, unique enough per product not to collide. */
const DELETES: { id: string; q: string }[] = [
  { id: "premier-housewares-0507070", q: "Can this basket hold water?" },
  { id: "premier-housewares-0507596", q: "Is the basket food safe?" },
  { id: "premier-housewares-0507597", q: "Can this basket hold water?" },
  { id: "premier-housewares-1101473", q: "require a battery or a socket?" },
  { id: "premier-housewares-1411436", q: "Is a saucer or liner included" },
  {
    id: "premier-housewares-1411436",
    q: "Can this planter be left outside in frost?",
  },
  {
    id: "premier-housewares-1411436",
    q: "safe to use in different environments?",
  },
  { id: "premier-housewares-1411603", q: "Does it have drainage holes?" },
  {
    id: "premier-housewares-1411603",
    q: "Is there a saucer or liner included?",
  },
  {
    id: "premier-housewares-1411603",
    q: "Can the planters be left outside in frost?",
  },
  {
    id: "premier-housewares-1411603",
    q: "Are the planters suitable for indoor use?",
  },
  {
    id: "premier-housewares-1411648",
    q: "Is a saucer or liner included with the planters?",
  },
  {
    id: "premier-housewares-1411661",
    q: "Is a saucer or liner included with the planter?",
  },
  { id: "premier-housewares-2200480", q: "made of real glass?" },
  {
    id: "premier-housewares-2200662",
    q: "Is the clock suitable for outdoor use?",
  },
  { id: "premier-housewares-2200970", q: "hung portrait or landscape?" },
  {
    id: "premier-housewares-2200970",
    q: "Is the glass on this clock real glass?",
  },
  { id: "premier-housewares-2201020", q: "portrait or landscape orientation?" },
  {
    id: "premier-housewares-2201054",
    q: "Is the glass used in the clock real glass?",
  },
  { id: "premier-housewares-2201105", q: "hung either portrait or landscape?" },
  {
    id: "premier-housewares-2201113",
    q: "both portrait and landscape orientations?",
  },
  {
    id: "premier-housewares-2502320",
    q: "safe for use in a bathroom or outdoors?",
  },
  { id: "premier-housewares-2502340", q: "Can the lamp be dimmed?" },
  {
    id: "premier-housewares-2502340",
    q: "Is this lamp safe for bathroom use?",
  },
  {
    id: "premier-housewares-5100311",
    q: "Is there a warranty included with the purchase?",
  },
  {
    id: "premier-housewares-5502316",
    q: "Is there a warranty on this product?",
  },
  {
    id: "premier-housewares-5502329",
    q: "Is a saucer or liner included with the plant stand?",
  },
  {
    id: "premier-housewares-5502329",
    q: "Can this plant stand be left outside during frost?",
  },
  { id: "premier-housewares-5502851", q: "Is a cover included?" },
  { id: "premier-housewares-5503133", q: "require a battery or mains supply?" },
  { id: "premier-housewares-5503138", q: "hung portrait and landscape?" },
  { id: "premier-housewares-5503246", q: "need a battery or a socket?" },
  { id: "premier-housewares-5503357", q: "cable length or adjustable drop?" },
  {
    id: "premier-housewares-5503368",
    q: "Does this mirror require a battery?",
  },
  { id: "premier-housewares-5503368", q: "Is the glass real glass?" },
  { id: "premier-housewares-5504052", q: "require a battery or mains supply?" },
  {
    id: "premier-housewares-5505788",
    q: "Does the planter have drainage holes?",
  },
  { id: "premier-housewares-5505789", q: "have drainage holes?" },
  {
    id: "premier-housewares-5505790",
    q: "Is a saucer or liner included with the planter?",
  },
  { id: "premier-housewares-5505796", q: "have drainage holes?" },
  { id: "premier-housewares-5505800", q: "have drainage holes?" },
  {
    id: "premier-housewares-5505800",
    q: "Is a saucer or liner included with the planter?",
  },
  {
    id: "premier-housewares-5505800",
    q: "Can this planter be left outside in frost?",
  },
  { id: "premier-housewares-5505802", q: "used outdoors in frost?" },
  {
    id: "premier-housewares-5506072",
    q: "Is a saucer or liner included with the planter?",
  },
  {
    id: "premier-housewares-5506189",
    q: "Is a saucer or liner included with the planter?",
  },
  {
    id: "premier-housewares-5506425",
    q: "Is a saucer or liner included with the planter?",
  },
  { id: "premier-housewares-5506425", q: "left outside during frost?" },
  {
    id: "premier-housewares-5506429",
    q: "Is a saucer or liner included with this planter?",
  },
  {
    id: "premier-housewares-5506560",
    q: "Is a saucer or liner included with the planter?",
  },
  {
    id: "premier-housewares-5506562",
    q: "Does the planter have drainage holes?",
  },
  {
    id: "premier-housewares-5506562",
    q: "Is a saucer or liner included with the planter?",
  },
  {
    id: "premier-housewares-5506673",
    q: "Does the planter have drainage holes?",
  },
  {
    id: "premier-housewares-5509127",
    q: "Is a saucer or liner included with the plant stand?",
  },
  {
    id: "premier-housewares-5509127",
    q: "Is the plant stand frost resistant?",
  },
  { id: "premier-housewares-5509209", q: "Is a saucer or liner included?" },
  {
    id: "premier-housewares-5511254",
    q: "installed safely in a bathroom or outdoors?",
  },
  { id: "premier-housewares-5511673", q: "special dimming capabilities?" },
  {
    id: "premier-housewares-5511733",
    q: "use a dimmable bulb with this lamp?",
  },
  { id: "premier-housewares-5511735", q: "Is the lamp dimmable?" },
  { id: "premier-housewares-5511826", q: "Can the lamp be used outdoors?" },
  { id: "premier-housewares-5521106", q: "portrait or landscape orientation?" },
  {
    id: "premier-housewares-5521106",
    q: "Is the glass in the artwork real glass?",
  },
  { id: "premier-housewares-5521147", q: "Is the glass real glass?" },
  {
    id: "premier-housewares-5528012",
    q: "Are cushions included with the coffee table?",
  },
  { id: "premier-housewares-5528057", q: "Is a cover included with the set?" },
  { id: "premier-housewares-5528547", q: "Do I need any tools for assembly?" },
  { id: "premier-housewares-5528633", q: "Can this chair be used outdoors?" },
  {
    id: "premier-housewares-5528698",
    q: "Is this table suitable for outdoor use?",
  },
  {
    id: "premier-housewares-5529011",
    q: "Can the table's height be adjusted?",
  },
  {
    id: "premier-housewares-5529698",
    q: "Are the cushions included with the chair?",
  },
  {
    id: "premier-housewares-5529698",
    q: "Can this chair be left outside all year?",
  },
  {
    id: "premier-housewares-5529699",
    q: "Is a cover included with the dining chair?",
  },
  { id: "product-aosom-b31-300", q: "put this chandelier on a dimmer?" },
  {
    id: "product-import-axis-putty-grey-chair",
    q: "Does the chair require assembly?",
  },
  {
    id: "product-import-etched-collection-tall-pot-with-handle",
    q: "come in different sizes?",
  },
  {
    id: "product-import-vellis-wingback-armchair",
    q: "Does the Vellis Armchair require assembly?",
  },
  {
    id: "product-import-zephra-chair",
    q: "Does the Zephra Armchair require assembly?",
  },
];

const REPLACES: { id: string; q: string; answer: string }[] = [
  {
    id: "premier-housewares-2200662",
    q: "Are fixings included for hanging the clock?",
    answer:
      "Fixings are not included — source suitable fixings separately for your wall type.",
  },
  {
    id: "premier-housewares-2200970",
    q: "Are fixings included with the clock?",
    answer:
      "Fixings are not included — source suitable fixings based on your wall type.",
  },
  {
    id: "premier-housewares-2401608",
    q: "Are fixings supplied with the mirror?",
    answer:
      "Fixings are not included — source fixings suitable for your wall type separately.",
  },
  {
    id: "premier-housewares-2404467",
    q: "Can the chair be left outside all year?",
    answer: "Store it in a dry place during adverse weather.",
  },
  {
    id: "premier-housewares-2405802",
    q: "Can this sofa be left outside year-round?",
    answer: "Store the sofa and any cushions indoors during inclement weather.",
  },
  {
    id: "premier-housewares-2406729",
    q: "Can the table be left outside in all weather?",
    answer: "Store the table dry when not in use.",
  },
  {
    id: "premier-housewares-2406745",
    q: "Can I leave it outside all year?",
    answer: "It's advisable to protect it against the elements for longevity.",
  },
  {
    id: "premier-housewares-5502316",
    q: "Can I leave it outdoors all year?",
    answer: "It's advisable to store cushions dry.",
  },
  {
    id: "premier-housewares-5503368",
    q: "hung in portrait and landscape orientation?",
    answer: "As a round mirror, it can be hung in any orientation.",
  },
  {
    id: "premier-housewares-5511371",
    q: "come with the necessary installation components?",
    answer: "Yes, it includes the ceiling rose and flex.",
  },
  {
    id: "premier-housewares-5511726",
    q: "Are mounting fixings included?",
    answer: "Mounting fixings may need to be sourced separately.",
  },
  {
    id: "premier-housewares-5511824",
    q: "Is a bulb included with the lamp?",
    answer: "A bulb may need to be purchased separately.",
  },
  {
    id: "premier-housewares-5511872",
    q: "hard-wiring or does it plug in?",
    answer: "Consult a qualified electrician for mains-wired fittings.",
  },
  {
    id: "premier-housewares-5521106",
    q: "Can this artwork be placed outdoors?",
    answer: "Best kept indoors.",
  },
  {
    id: "premier-housewares-5527329",
    q: "Is the fabric stain-resistant?",
    answer: "Manage spills promptly to help prevent staining.",
  },
  {
    id: "premier-housewares-5528548",
    q: "Can it be left outdoors all year?",
    answer: "Store the cushions dry when not in use.",
  },
  {
    id: "premier-housewares-5528627",
    q: "Are cushions and covers supplied?",
    answer: "The set includes a plush cream cushion.",
  },
  {
    id: "premier-housewares-5528627",
    q: "How much assembly is involved?",
    answer: "This product requires assembly and ships in one box.",
  },
  {
    id: "premier-housewares-5528627",
    q: "Can it be left outdoors all year?",
    answer: "Store cushions dry.",
  },
  {
    id: "product-aosom-b31-087",
    q: "allow for adjustable drop?",
    answer: "No — installed height is fixed at 48cm.",
  },
];

interface Faq {
  _key: string;
  question: string;
  answer: string;
}

async function main() {
  const affectedIds = [
    ...new Set([...DELETES.map((d) => d.id), ...REPLACES.map((r) => r.id)]),
  ];
  const results: {
    id: string;
    title: string;
    deletesMatched: number;
    deletesExpected: number;
    replacesMatched: number;
    replacesExpected: number;
  }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  for (const id of affectedIds) {
    const doc = await client.fetch<{ title: string; faqs: Faq[] } | null>(
      `*[_id == $id][0]{title, faqs}`,
      { id },
    );
    if (!doc) {
      results.push({
        id,
        title: "(not found)",
        deletesMatched: 0,
        deletesExpected: DELETES.filter((d) => d.id === id).length,
        replacesMatched: 0,
        replacesExpected: REPLACES.filter((r) => r.id === id).length,
      });
      continue;
    }

    const deletesForId = DELETES.filter((d) => d.id === id);
    const replacesForId = REPLACES.filter((r) => r.id === id);
    let deletesMatched = 0;
    let replacesMatched = 0;

    const newFaqs = doc.faqs
      .map((f) => {
        const replace = replacesForId.find((r) => f.question.includes(r.q));
        if (replace) {
          replacesMatched += 1;
          return { ...f, answer: replace.answer };
        }
        return f;
      })
      .filter((f) => {
        const del = deletesForId.find((d) => f.question.includes(d.q));
        if (del) deletesMatched += 1;
        return !del;
      });

    results.push({
      id,
      title: doc.title,
      deletesMatched,
      deletesExpected: deletesForId.length,
      replacesMatched,
      replacesExpected: replacesForId.length,
    });

    if (apply) {
      transaction.patch(id, (p) => p.set({ faqs: newFaqs }));
      queued += 1;
    }
  }

  console.table(results);
  const mismatches = results.filter(
    (r) =>
      r.deletesMatched !== r.deletesExpected ||
      r.replacesMatched !== r.replacesExpected,
  );
  if (mismatches.length) {
    console.log("\nMISMATCHES (did not match expected count):");
    console.table(mismatches);
  }

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-faq-gap-admissions-fix-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
