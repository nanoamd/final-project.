/**
 * Makes every product's stated returns window match the published policy.
 *
 * The Solar Garden Lamp Post's delivery notes promised 30 days to change your
 * mind. /returns says 14, the other 24 products with a returns paragraph say
 * 14, and the `MerchantReturnPolicy` in the Product structured data says 14 —
 * so the site was making two different promises about the same policy, and the
 * one on the product page is the one a customer reads before buying.
 *
 * The notes are copy pasted per product from the supplier's own page as each
 * one is listed, which is how the outlier got in and why this checks rather
 * than assumes: a second product listed from a supplier who offers 30 days will
 * bring the same sentence with it.
 *
 * Aligns downwards, to the 14 days the policy actually offers. If the intention
 * is ever to offer 30, that is a change to /returns and to RETURN_POLICY in
 * json-ld.tsx first, and this script's POLICY_DAYS after — not a sentence on one
 * product page.
 *
 * Reports anything it cannot rewrite rather than guessing at the wording.
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/align-returns-window.ts
 */
import { pathToFileURL } from "node:url";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

/** Must match /returns and RETURN_POLICY.merchantReturnDays in json-ld.tsx. */
const POLICY_DAYS = 14;

/**
 * Built on demand, not at import: the test imports alignReturnsWindow from this
 * file, and a token check at module scope would abort the test run instead.
 */
function makeClient() {
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!token) {
    console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
    process.exit(1);
  }
  return createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
    token,
    useCdn: false,
  });
}

/**
 * "within 30 days of delivery" / "within 21 days of receipt". Only a window
 * anchored to delivery or receipt is a returns window — a lead time of "7-10
 * working days" must not be touched, which is why the anchor is required.
 */
const WINDOW =
  /\bwithin\s+(\d+)\s+(?:calendar\s+)?days?\s+of\s+(delivery|receipt)\b/gi;

export function alignReturnsWindow(
  notes: string,
  policyDays = POLICY_DAYS,
): { text: string; from: number[] } {
  const from: number[] = [];
  const text = notes.replace(WINDOW, (match, days: string, anchor: string) => {
    if (Number(days) === policyDays) return match;
    from.push(Number(days));
    return `within ${policyDays} days of ${anchor}`;
  });
  return { text, from };
}

async function main() {
  const client = makeClient();
  const products = await client.fetch<
    { _id: string; title: string; deliveryNotes: string }[]
  >(
    `*[_type == "product" && defined(deliveryNotes)]{_id, title, deliveryNotes} | order(title asc)`,
  );

  const changes: {
    _id: string;
    title: string;
    from: number[];
    text: string;
  }[] = [];
  for (const p of products) {
    const { text, from } = alignReturnsWindow(p.deliveryNotes);
    if (!from.length) continue;
    changes.push({ _id: p._id, title: p.title, from, text });
  }

  console.log(
    `\n${products.length} product(s) with delivery notes; ` +
      `${changes.length} promising a window other than ${POLICY_DAYS} days.\n`,
  );
  for (const c of changes)
    console.log(
      `  ${c.from.join(", ")} days → ${POLICY_DAYS}   ` +
        `${c._id.startsWith("drafts.") ? "[draft] " : ""}${c.title.slice(0, 60)}`,
    );

  if (!changes.length) {
    console.log(
      "Nothing to do — every product matches the published policy.\n",
    );
    return;
  }
  if (!apply) {
    console.log("\nDry run — nothing written. Re-run with --apply.\n");
    return;
  }

  for (const c of changes) {
    await client.patch(c._id).set({ deliveryNotes: c.text }).commit();
    console.log(`✓ ${c.title.slice(0, 60)}`);
  }
  console.log(`\nDone. ${changes.length} product(s) aligned.\n`);
}

const runDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (runDirectly) {
  void main().catch((err) => {
    console.error("align-returns-window failed:", err);
    process.exit(1);
  });
}
