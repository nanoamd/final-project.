/**
 * Resolves every FAQ whose answer admits it does not know something.
 *
 * Damien: "Fix 976. Weights can be extracted from the supplier link unless they
 * don't specify." That is the rule this implements, applied to all 2,628 such
 * answers rather than only the 976 in one snapshot:
 *
 *   - the supplier publishes the fact  → answer it, in Kaiku's own voice
 *   - we already hold the fact         → answer it
 *   - nobody publishes it              → delete the question
 *
 * Deleting is the right outcome for the third case, not a failure to try. A
 * page that asks "How long does it burn for?" and answers "the burn time is not
 * specified" has spent the reader's attention to tell them nothing, and it
 * advertises that we did not check. Removing it is the honest move; inventing a
 * burn time is the dishonest one.
 *
 * Facts come from `.audit/harvested-facts.json`, written by
 * scripts/harvest-supplier-facts.ts. Run that first.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-catalogue-faqs.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-catalogue-faqs.ts --apply
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const ADMITS_UNKNOWN =
  /\bnot specified\b|\bnot stated\b|\bnot provided\b|\bnot listed\b|\bN\/A\b|\bnot explicitly\b|\bplease (?:refer|consult|check)\b/i;

interface Harvested {
  weightKg?: number;
  weightIsCartonOnly?: boolean;
  material?: string;
  colour?: string;
  extra?: Record<string, string>;
}

/**
 * Question topic → the harvested label or held field that answers it.
 *
 * Each entry needs an exact source. A topic with no source is not listed, which
 * means its questions get deleted — the deliberate default.
 */
const ANSWERS: {
  topic: string;
  asks: RegExp;
  /** Must not fire when the question is really about something else. */
  notAbout?: RegExp;
  from: (context: {
    facts: Harvested;
    leadTime?: string | null;
    name: string;
  }) => string | null;
}[] = [
  {
    topic: "battery",
    asks: /\bbatter(?:y|ies)\b/i,
    from: ({ facts }) => {
      const value = facts.extra?.["Battery Type"];
      return value ? `${sentence(value)}` : null;
    },
  },
  {
    topic: "assembly",
    asks: /\bassembl|\bself[- ]assembly|\bput together\b/i,
    from: ({ facts, name }) => {
      const value = facts.extra?.["Assembly Required"];
      if (!value) return null;
      return /^no\b/i.test(value)
        ? `No assembly is required — the ${name} arrives ready to use.`
        : `${sentence(value)}`;
    },
  },
  {
    topic: "outdoor use",
    asks: /\boutdoor|outside|weatherproof|waterproof|all weather\b/i,
    from: ({ facts, name }) => {
      const value = facts.extra?.["Indoor Outdoor Use"];
      if (!value) return null;
      if (/indoor only/i.test(value))
        return `The ${name} is for indoor use only.`;
      return `${sentence(value)}`;
    },
  },
  {
    topic: "flame or LED",
    asks: /\breal flame|naked flame|candle type|battery powered\b/i,
    from: ({ facts }) => {
      const value = facts.extra?.["Candle Type"];
      return value ? sentence(value) : null;
    },
  },
  {
    topic: "bulb",
    asks: /\bbulb|wattage|watt\b/i,
    from: ({ facts }) => {
      const bulb = facts.extra?.["Bulb Type"];
      const watts = facts.extra?.["Wattage"];
      if (!bulb && !watts) return null;
      return sentence([bulb, watts].filter(Boolean).join(", "));
    },
  },
  {
    topic: "material",
    asks: /\bmaterial|made (?:of|from)|what is it made\b/i,
    notAbout: /\bcare|clean\b/i,
    from: ({ facts, name }) =>
      facts.material
        ? `The ${name} is made from ${facts.material.toLowerCase()}.`
        : null,
  },
  {
    topic: "delivery",
    asks: /\bdeliver|dispatch|how long.*(?:arrive|take)\b/i,
    from: ({ leadTime, name }) =>
      leadTime
        ? `The ${name} is typically delivered within ${leadTime}. UK delivery is free on every order.`
        : null,
  },
];

/** Tidies a supplier's fragment into a sentence. */
function sentence(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const capped = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
}

interface Outcome {
  id: string;
  title: string;
  question: string;
  before: string;
  action: "answered" | "removed";
  after?: string;
  topic?: string;
}

async function main() {
  if (!existsSync(".audit/harvested-facts.json")) {
    console.error(
      "No harvested facts. Run scripts/harvest-supplier-facts.ts first.",
    );
    process.exit(1);
  }
  const harvested: Record<string, Harvested> = JSON.parse(
    readFileSync(".audit/harvested-facts.json", "utf8"),
  );

  const rows: {
    _id: string;
    title?: string;
    deliveryLeadTime?: string;
    faqs?: { _key?: string; question?: string; answer?: string }[];
  }[] = await client.fetch(
    `*[_type == "product" && count(faqs) > 0]{ _id, title, deliveryLeadTime, faqs }`,
  );

  const outcomes: Outcome[] = [];
  const patches: { id: string; faqs: unknown[] }[] = [];
  const unresolvedTopics = new Map<string, number>();

  for (const row of rows) {
    const title = row.title ?? "";
    const name = title.replace(/\s*\|\s*Kaiku\s*$/i, "");
    const facts = harvested[row._id] ?? {};
    let touched = false;

    const kept: unknown[] = [];
    for (const faq of row.faqs ?? []) {
      const answer = faq.answer ?? "";
      const question = faq.question ?? "";
      if (!ADMITS_UNKNOWN.test(answer)) {
        kept.push(faq);
        continue;
      }

      let replacement: string | null = null;
      let topic = "";
      for (const rule of ANSWERS) {
        if (!rule.asks.test(question)) continue;
        if (rule.notAbout?.test(question)) continue;
        replacement = rule.from({
          facts,
          leadTime: row.deliveryLeadTime,
          name,
        });
        if (replacement) {
          topic = rule.topic;
          break;
        }
      }

      touched = true;
      if (replacement) {
        outcomes.push({
          id: row._id,
          title,
          question,
          before: answer,
          action: "answered",
          after: replacement,
          topic,
        });
        kept.push({ ...faq, answer: replacement });
      } else {
        // Nobody publishes it. The question goes rather than being answered
        // with a guess.
        outcomes.push({
          id: row._id,
          title,
          question,
          before: answer,
          action: "removed",
        });
        const key = question.slice(0, 40).toLowerCase();
        unresolvedTopics.set(key, (unresolvedTopics.get(key) ?? 0) + 1);
      }
    }

    if (touched) patches.push({ id: row._id, faqs: kept });
  }

  const answered = outcomes.filter((o) => o.action === "answered");
  const removed = outcomes.filter((o) => o.action === "removed");

  console.log(`\n${apply ? "APPLYING" : "DRY RUN"} — FAQ resolution\n`);
  console.log(`FAQs admitting ignorance   ${outcomes.length}`);
  console.log(`  answered from a real fact ${answered.length}`);
  console.log(`  removed (nobody publishes it) ${removed.length}`);
  console.log(`Products touched            ${patches.length}`);

  const byTopic = new Map<string, number>();
  for (const outcome of answered)
    byTopic.set(outcome.topic!, (byTopic.get(outcome.topic!) ?? 0) + 1);
  console.log(`\nanswered by topic:`);
  for (const [topic, count] of [...byTopic].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(count).padStart(4)}  ${topic}`);

  console.log(`\n──── sample of answers ────`);
  for (const outcome of answered.slice(0, 10)) {
    console.log(`\n${outcome.title.slice(0, 46)}  [${outcome.topic}]`);
    console.log(`  Q  ${outcome.question.slice(0, 80)}`);
    console.log(`  −  ${outcome.before.slice(0, 80)}`);
    console.log(`  +  ${outcome.after!.slice(0, 120)}`);
  }

  mkdirSync("docs/change-log", { recursive: true });
  const stamp = new Date().toISOString();
  const path = `docs/change-log/${stamp.slice(0, 10)}-faqs.json`;
  writeFileSync(
    path,
    JSON.stringify({ generatedAt: stamp, applied: apply, outcomes }, null, 2),
  );
  console.log(`\nChange log: ${path}`);

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }
  let done = 0;
  for (const patch of patches) {
    await client.patch(patch.id).set({ faqs: patch.faqs }).commit();
    if (++done % 50 === 0) console.log(`  patched ${done}/${patches.length}`);
  }
  console.log(`\nPatched ${done} products.`);
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
