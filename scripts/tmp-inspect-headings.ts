import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Block {
  _type?: string;
  _key?: string;
  style?: string;
  children?: { text?: string }[];
}

const IDS = [
  "premier-housewares-1411436",
  "premier-housewares-2406213",
  "premier-housewares-2406765",
  "premier-housewares-5502329",
  "premier-housewares-5505784",
  "premier-housewares-5505788",
  "premier-housewares-5505789",
  "premier-housewares-5505790",
  "premier-housewares-5505796",
  "premier-housewares-5505800",
  "premier-housewares-5506429",
  "premier-housewares-5506562",
  "premier-housewares-5506565",
  "premier-housewares-5506673",
  "premier-housewares-5509127",
  "premier-housewares-5511874",
  "premier-housewares-5529698",
];

async function main() {
  const rows: { _id: string; title: string; description: Block[] | null }[] =
    await client.fetch(`*[_id in $ids]{_id, title, description}`, {
      ids: IDS,
    });
  for (const row of rows) {
    console.log(`\n==== ${row._id} | ${row.title}`);
    for (const b of row.description ?? []) {
      const text = (b.children ?? []).map((c) => c.text ?? "").join("");
      console.log(`  [${b.style}] ${b._key}: ${JSON.stringify(text)}`);
    }
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
