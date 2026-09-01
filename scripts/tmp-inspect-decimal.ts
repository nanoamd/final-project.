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

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: { text?: string }[];
}

const IDS = [
  "premier-housewares-5506889",
  "premier-housewares-5529745",
  "product-import-aegina-table-lamp",
  "product-import-antique-gold-marching-hares-lamp-with-green-velvet-shade",
  "product-import-augusta-column-table-lamp-with-linen-shade",
  "product-import-bloom-collection-outdoor-footstool",
  "product-import-contour-collection-2-drawer-2-door-sideboard",
  "product-import-contour-collection-3-drawer-console",
  "product-import-large-black-multi-shelf-unit",
  "product-import-the-camden-collection-round-side-table",
];

async function main() {
  const rows: {
    _id: string;
    title: string;
    description: Block[] | null;
  }[] = await client.fetch(`*[_id in $ids]{_id, title, description}`, {
    ids: IDS,
  });
  for (const row of rows) {
    console.log(`\n==== ${row._id} | ${row.title}`);
    for (const b of row.description ?? []) {
      const text = (b.children ?? []).map((c) => c.text ?? "").join("");
      if (decimalArtefact.pattern.test(text)) {
        console.log(`  [${b.style}] ${b._key}: ${JSON.stringify(text)}`);
      }
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
