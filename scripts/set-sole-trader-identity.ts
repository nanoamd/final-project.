/**
 * Takes "Ltd" off the site, in Sanity as well as in code.
 *
 * Kaiku trades as a sole trader. The footer used to state *"Project Kaiku Ltd is a
 * company registered in England and Wales"* with no company number — unverifiable to
 * a customer, and a claim that has to be true. It mattered less for shopper trust
 * than for the three gatekeepers the business depends on, every one of which verifies
 * business identity rather than taking it on faith: **Stripe** at onboarding,
 * **Google Merchant Centre**, where misrepresentation is grounds for suspension
 * rather than a warning, and the **trade suppliers** whose applications have gone
 * unanswered.
 *
 * The code side is `siteConfig.legalName` and `companyDetails` in
 * `src/config/site.ts`. This script is the other half, and without it the change does
 * nothing visible: `siteSettings.legalName` in Sanity **overrides the config** in the
 * footer's copyright line (`settings?.legalName ?? siteConfig.legalName`), and it
 * held "Project Kaiku Ltd" in the published document.
 *
 * The draft is patched alongside the published document on purpose. Otherwise
 * publishing `siteSettings` at any point in the future silently puts "Ltd" back on
 * every page of the site.
 *
 * If Kaiku incorporates later, this runs in reverse: set the registered name here,
 * put the company number in `companyDetails`, and the footer wording follows.
 *
 *   pnpm tsx --env-file=.env.local scripts/set-sole-trader-identity.ts
 *   pnpm tsx --env-file=.env.local scripts/set-sole-trader-identity.ts --apply
 */
import { createClient } from "@sanity/client";

import { siteConfig } from "../src/config/site";

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

async function main() {
  console.log(`\n${apply ? "APPLYING" : "DRY RUN"}\n`);

  // Both the published document and its draft, so publishing later cannot undo it.
  const ids = ["siteSettings", "drafts.siteSettings"];

  for (const id of ids) {
    const current = await client.fetch<{ legalName?: string } | null>(
      `*[_id == $id][0]{ legalName }`,
      { id },
    );
    if (!current) {
      console.log(`  -  ${id} does not exist, nothing to do`);
      continue;
    }
    if (current.legalName === siteConfig.legalName) {
      console.log(`  ok ${id} already reads "${siteConfig.legalName}"`);
      continue;
    }

    console.log(
      `  →  ${id}: "${current.legalName ?? "(unset)"}" → "${siteConfig.legalName}"`,
    );
    if (!apply) continue;
    await client.patch(id).set({ legalName: siteConfig.legalName }).commit();
  }

  console.log(
    apply
      ? "\nDone. The footer copyright line and the order emails now read the trader's name.\n"
      : "\nDry run — nothing written. Re-run with --apply.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
