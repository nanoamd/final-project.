import { createClient } from "@sanity/client";

import { ARTEFACTS } from "../src/lib/catalog/quality";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
const decimalArtefact = ARTEFACTS.find((a) =>
  a.message.startsWith("A raw, unrounded number"),
)!;
const gapArtefact = ARTEFACTS.find((a) =>
  a.message.startsWith("The copy admits it does not know"),
)!;

interface Block {
  _type?: string;
  children?: { text?: string }[];
}

function textOf(description: unknown): string {
  if (!Array.isArray(description)) return "";
  return (description as Block[])
    .filter((b) => b._type === "block")
    .map((b) => (b.children ?? []).map((c) => c.text ?? "").join(""))
    .join("\n");
}

async function main() {
  const rows: { _id: string; description: unknown }[] = await client.fetch(
    `*[_type == "product"]{_id, description}`,
  );
  let pubDec = 0,
    draftDec = 0,
    pubGap = 0,
    draftGap = 0;
  for (const row of rows) {
    const t = textOf(row.description);
    const isDraft = row._id.startsWith("drafts.");
    if (decimalArtefact.pattern.test(t)) {
      if (isDraft) draftDec++;
      else pubDec++;
    }
    if (gapArtefact.pattern.test(t)) {
      if (isDraft) draftGap++;
      else pubGap++;
    }
  }
  console.log(
    `total docs: ${rows.length}\ndecimal: published=${pubDec} draft=${draftDec}\ngap: published=${pubGap} draft=${draftGap}`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
