/**
 * Derives every product's `shippingCost` from its supplier's carriage rule, so
 * a supplier's terms are entered once and every product they supply picks them
 * up.
 *
 * Damien: "i want zero shipping costs in the prices for any products, i will
 * upload shipping cost rules for each supplier and you will audit the prices to
 * accommodate." This is the half that reads the rules. Run it after entering a
 * supplier's carriage terms in Studio (Supplier → Carriage terms); then
 * `scripts/margin-report.ts` shows what each product truly leaves, and only
 * then is there any point auditing prices against it.
 *
 * **Nothing here touches a price, and nothing reaches a customer.** The
 * customer pays £0 carriage on every order — one £0 shipping option in
 * `createCheckoutSession`, and `shippingCost` appears in no storefront query.
 * This records what carriage costs *Kaiku*, which is what makes a margin real.
 *
 * **An unknown stays unknown.** Where a rule cannot be resolved — a
 * weight-banded rate against a product with no recorded weight — the field is
 * left exactly as it is rather than being set to 0. Writing 0 would claim
 * carriage is free, and a fake zero is how a product comes to look profitable
 * when nobody has actually checked. Those products are counted and listed at the
 * end instead, which is the real to-do list.
 *
 *   pnpm tsx --env-file=.env.local scripts/apply-supplier-shipping-rules.ts
 *   pnpm tsx --env-file=.env.local scripts/apply-supplier-shipping-rules.ts --apply
 *   pnpm tsx --env-file=.env.local scripts/apply-supplier-shipping-rules.ts --supplier "AW Dropship" --apply
 */
import { createClient } from "@sanity/client";

import {
  describeRule,
  resolveShippingCost,
  ruleNeedsWeight,
  type ShippingRule,
} from "../src/lib/suppliers/shipping-rules";

const apply = process.argv.includes("--apply");
const includeDrafts = process.argv.includes("--drafts");
const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const onlySupplier = arg("supplier");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface Row {
  _id: string;
  title: string;
  costPrice?: number | null;
  shippingCost?: number | null;
  weightKg?: number | null;
  weightUnit?: string | null;
  supplierName?: string | null;
  rule?: ShippingRule | null;
}

/** Weight in kilograms, whatever unit the product recorded it in. */
function weightInKg(row: Row): number | null {
  if (typeof row.weightKg !== "number") return null;
  const unit = (row.weightUnit ?? "kg").toLowerCase();
  if (unit === "kg") return row.weightKg;
  if (unit === "g") return row.weightKg / 1000;
  if (unit === "lb") return row.weightKg * 0.453592;
  // An unrecognised unit is not silently assumed to be kilograms — that would
  // put a 20lb table in the wrong band.
  return null;
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && defined(supplier)${includeDrafts ? "" : ' && !(_id in path("drafts.**"))'}]{
      _id, title, costPrice, shippingCost,
      "weightKg": weight.value,
      "weightUnit": weight.unit,
      "supplierName": supplier->name,
      "rule": supplier->shippingRule
    } | order(supplierName asc, title asc)`,
  );

  const considered = onlySupplier
    ? rows.filter((row) => row.supplierName === onlySupplier)
    : rows;

  console.log(
    `\n${considered.length} products with a supplier` +
      `${onlySupplier ? ` (${onlySupplier})` : ""}` +
      `${includeDrafts ? ", drafts included" : ""}.\n${apply ? "APPLYING" : "DRY RUN"}\n`,
  );

  // Which suppliers actually have a rule to apply — reported up front, because
  // "0 changes" usually means nobody has entered the terms yet, and that is
  // worth saying plainly rather than leaving to be inferred.
  const rulesBySupplier = new Map<string, ShippingRule | null>();
  for (const row of considered)
    if (row.supplierName)
      rulesBySupplier.set(row.supplierName, row.rule ?? null);

  console.log("Carriage terms on record:");
  for (const [name, rule] of [...rulesBySupplier].sort())
    console.log(`  ${name.slice(0, 40).padEnd(42)} ${describeRule(rule)}`);
  console.log();

  let changed = 0;
  let unchanged = 0;
  const unresolved: { title: string; supplier: string; why: string }[] = [];

  for (const row of considered) {
    if (!row.rule) {
      unresolved.push({
        title: row.title,
        supplier: row.supplierName ?? "?",
        why: "no carriage terms recorded for this supplier",
      });
      continue;
    }

    const kg = weightInKg(row);
    const resolved = resolveShippingCost(row.rule, {
      weightKg: kg,
      orderValue: row.costPrice ?? null,
    });

    if (resolved === null) {
      unresolved.push({
        title: row.title,
        supplier: row.supplierName ?? "?",
        why: ruleNeedsWeight(row.rule)
          ? kg === null
            ? "rule is weight-banded and the product records no usable weight"
            : `weight ${kg}kg is above the heaviest band`
          : "rule needs a figure the product does not carry",
      });
      continue;
    }

    if (row.shippingCost === resolved) {
      unchanged += 1;
      continue;
    }

    changed += 1;
    console.log(
      `  ✓ ${row.title.slice(0, 50).padEnd(50)} ${String(row.shippingCost ?? "unset").padStart(7)} -> £${resolved.toFixed(2)}`,
    );

    if (!apply) continue;
    await client.patch(row._id).set({ shippingCost: resolved }).commit();
  }

  console.log(
    `\n${changed} products' carriage cost derived, ${unchanged} already correct, ` +
      `${unresolved.length} left unknown (deliberately not set to 0).\n`,
  );

  if (unresolved.length) {
    const byReason = new Map<string, number>();
    for (const item of unresolved)
      byReason.set(
        `${item.supplier}: ${item.why}`,
        (byReason.get(`${item.supplier}: ${item.why}`) ?? 0) + 1,
      );
    console.log("Still unknown — this is the to-do list:");
    for (const [reason, count] of [...byReason].sort((a, b) => b[1] - a[1]))
      console.log(`  ${String(count).padStart(4)}  ${reason}`);
  }

  console.log(
    apply
      ? "\nApplied. No price was changed and nothing here reaches a customer.\n"
      : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
