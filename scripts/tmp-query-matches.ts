/**
 * SCRATCH: Finds every PUBLISHED product whose description matches either
 * broadened ARTEFACTS regex in src/lib/catalog/quality.ts ("admits it does
 * not know" / "raw, unrounded number"). Pulled directly from ARTEFACTS so
 * this can never drift from the ground-truth patterns. Deleted after use.
 */
import { writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

import { ARTEFACTS } from "../src/lib/catalog/quality";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const gapArtefact = ARTEFACTS.find((a) =>
  a.message.startsWith("The copy admits it does not know"),
)!;
const decimalArtefact = ARTEFACTS.find((a) =>
  a.message.startsWith("A raw, unrounded number"),
)!;

interface Block {
  _type?: string;
  children?: { text?: string }[];
  [k: string]: unknown;
}
interface Row {
  _id: string;
  title: string;
  summary: string | null;
  description: Block[] | null;
  faqs: { question?: string; answer?: string }[] | null;
  seo: { metaTitle?: string; metaDescription?: string } | null;
}

function textOf(description: Block[] | null): string {
  if (!Array.isArray(description)) return "";
  return description
    .filter((b) => b._type === "block")
    .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""))
    .join("\n");
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{_id, title, summary, description, faqs, seo}`,
  );
  console.log(`Total published products: ${rows.length}`);

  const gapMatches: Row[] = [];
  const decimalMatches: Row[] = [];
  const descOnlyGap: Row[] = [];
  const descOnlyDecimal: Row[] = [];
  for (const row of rows) {
    const descText = textOf(row.description);
    const everyField = [
      row.summary ?? "",
      descText,
      (row.faqs ?? [])
        .map((f) => `${f?.question ?? ""} ${f?.answer ?? ""}`)
        .join("\n"),
      row.seo?.metaTitle ?? "",
      row.seo?.metaDescription ?? "",
    ].join("\n");
    if (gapArtefact.pattern.test(everyField)) gapMatches.push(row);
    if (decimalArtefact.pattern.test(everyField)) decimalMatches.push(row);
    if (gapArtefact.pattern.test(descText)) descOnlyGap.push(row);
    if (decimalArtefact.pattern.test(descText)) descOnlyDecimal.push(row);
  }
  console.log(
    `(description-only: gap=${descOnlyGap.length}, decimal=${descOnlyDecimal.length})`,
  );

  console.log(`Gap-admission matches: ${gapMatches.length}`);
  console.log(`Raw-decimal matches:   ${decimalMatches.length}`);

  const byId = new Map<string, Row>();
  for (const r of [...descOnlyGap, ...descOnlyDecimal]) byId.set(r._id, r);
  console.log(`Deduped total (description-only): ${byId.size}`);

  const out = {
    gapIds: descOnlyGap.map((r) => r._id),
    decimalIds: descOnlyDecimal.map((r) => r._id),
    all: [...byId.values()].map((r) => ({ _id: r._id, title: r.title })),
  };
  writeFileSync(
    "/tmp/claude-0/-home-user-final-project-/faaf1922-1604-5b81-b3ee-c4782f0da6af/scratchpad/matches.json",
    JSON.stringify(out, null, 2),
  );
  console.log("Wrote matches.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
