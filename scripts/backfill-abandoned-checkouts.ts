/**
 * Recovers every abandoned checkout Stripe still remembers.
 *
 * Somebody picked a product, went to pay, typed their email address and then
 * stopped. Stripe kept that email. We did not: the webhook's
 * `checkout.session.expired` branch logged the session id and discarded
 * everything else, so `abandoned_checkouts` — a table that has existed since
 * migration 0003 for exactly this — has never had a row written to it.
 *
 * The webhook now records them going forward. This script deals with the
 * backlog: it walks Stripe's own session list, finds the ones that expired,
 * and writes them into that table so the admin pages and the recovery email
 * have something to work with. Stripe retains sessions for months, so the
 * leads from the summer are still sitting there.
 *
 * Read-only by default. `--apply` writes.
 *
 *   pnpm tsx --env-file=.env.local scripts/backfill-abandoned-checkouts.ts
 *   pnpm tsx --env-file=.env.local scripts/backfill-abandoned-checkouts.ts --apply
 *
 * Options:
 *   --since=2025-06-01   only sessions created on or after this date
 *   --json=path.json     also write the full result to a file
 *
 * Needs STRIPE_SECRET_KEY to read, and additionally NEXT_PUBLIC_SUPABASE_URL
 * and SUPABASE_SERVICE_ROLE_KEY to --apply. Both are already in Vercel; if
 * .env.local does not have them, pull them once with `vercel env pull`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const apply = process.argv.includes("--apply");

function flag(name: string): string | undefined {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error(
    "STRIPE_SECRET_KEY is not set — there is nothing to read the sessions from.",
  );
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (apply && (!supabaseUrl || !serviceRoleKey)) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are needed to write — refusing to --apply.",
  );
  process.exit(1);
}

const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });

const since = flag("since");
const createdAfter = since
  ? Math.floor(new Date(since).getTime() / 1000)
  : null;
if (since && (createdAfter === null || Number.isNaN(createdAfter))) {
  console.error(`--since=${since} is not a date I can read (use YYYY-MM-DD).`);
  process.exit(1);
}

interface LineItem {
  slug: string | null;
  name: string | null;
  quantity: number | null;
  unit_amount: number | null;
}

interface Lead {
  stripe_session_id: string;
  email: string | null;
  amount_total: number | null;
  line_items: LineItem[] | null;
  created_at: string;
}

function money(pence: number | null): string {
  if (pence === null) return "—";
  return `£${(pence / 100).toFixed(2)}`;
}

async function main() {
  const leads: Lead[] = [];
  let scanned = 0;
  let expired = 0;

  // `line_items` is not returned on a listed session and cannot be expanded on
  // the list call, so each expired session is retrieved individually. There are
  // few enough of them that this is cheaper than it sounds, and knowing WHAT
  // somebody nearly bought is most of the value of knowing that they nearly did.
  for await (const session of stripe.checkout.sessions.list({
    limit: 100,
    ...(createdAfter ? { created: { gte: createdAfter } } : {}),
  })) {
    scanned += 1;
    if (session.status !== "expired") continue;
    expired += 1;

    let lineItems: LineItem[] | null = null;
    try {
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price.product"],
      });
      lineItems = (full.line_items?.data ?? []).map((line) => {
        const product = line.price?.product;
        const meta =
          product && typeof product !== "string" && !product.deleted
            ? product.metadata
            : undefined;
        return {
          slug: meta?.slug ?? null,
          name: line.description ?? null,
          quantity: line.quantity ?? null,
          unit_amount: line.price?.unit_amount ?? null,
        };
      });
    } catch (error) {
      console.error(`  could not expand ${session.id}:`, error);
    }

    leads.push({
      stripe_session_id: session.id,
      email: session.customer_details?.email ?? null,
      amount_total: session.amount_total ?? null,
      line_items: lineItems,
      created_at: new Date(session.created * 1000).toISOString(),
    });
  }

  leads.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const withEmail = leads.filter((lead) => lead.email);

  console.log(
    `\nScanned ${scanned} checkout sessions — ${expired} expired, ${withEmail.length} of those left an email address.\n`,
  );

  for (const lead of leads) {
    const items = (lead.line_items ?? [])
      .map((item) => `${item.quantity ?? 1}× ${item.name ?? item.slug ?? "?"}`)
      .join(", ");
    console.log(
      `${lead.created_at.slice(0, 10)}  ${(lead.email ?? "no email").padEnd(34)}  ${money(lead.amount_total).padStart(9)}  ${items}`,
    );
  }

  const jsonPath = flag("json");
  if (jsonPath) {
    mkdirSync(dirname(jsonPath), { recursive: true });
    writeFileSync(jsonPath, JSON.stringify(leads, null, 2));
    console.log(`\nWrote ${jsonPath}`);
  }

  if (!apply) {
    console.log(
      `\nDry run. Re-run with --apply to write ${leads.length} row(s) into abandoned_checkouts.`,
    );
    return;
  }

  if (leads.length === 0) {
    console.log("\nNothing to write.");
    return;
  }

  const supabase = createClient(supabaseUrl!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Upsert on the session id: this script is expected to be re-run, and a
  // duplicated lead is a duplicated recovery email to the same person.
  const { error } = await supabase.from("abandoned_checkouts").upsert(
    leads.map((lead) => ({
      stripe_session_id: lead.stripe_session_id,
      email: lead.email,
      amount_total: lead.amount_total,
      line_items: lead.line_items,
      created_at: lead.created_at,
    })),
    { onConflict: "stripe_session_id" },
  );

  if (error) {
    console.error("\nWrite failed:", error);
    process.exit(1);
  }

  console.log(`\nWrote ${leads.length} row(s) into abandoned_checkouts.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
