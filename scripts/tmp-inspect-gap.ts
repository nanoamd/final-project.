import { readFileSync } from "node:fs";

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

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: { text?: string }[];
}

async function main() {
  const ids: string[] = JSON.parse(
    readFileSync(
      "/tmp/claude-0/-home-user-final-project-/faaf1922-1604-5b81-b3ee-c4782f0da6af/scratchpad/matches.json",
      "utf8",
    ),
  ).gapIds;
  const rows: { _id: string; title: string; description: Block[] | null }[] =
    await client.fetch(`*[_id in $ids]{_id, title, description}`, { ids });
  const byId = new Map(rows.map((r) => [r._id, r]));
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) {
      console.log(`\n==== ${id} NOT FOUND`);
      continue;
    }
    console.log(`\n==== ${row._id} | ${row.title}`);
    for (const b of row.description ?? []) {
      const text = (b.children ?? []).map((c) => c.text ?? "").join("");
      // Test sentence by sentence
      const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      for (const s of sentences) {
        if (gapArtefact.pattern.test(s)) {
          console.log(`  [${b.style}] ${b._key}: ${JSON.stringify(s)}`);
        }
      }
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
