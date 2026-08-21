import { createClient } from "@sanity/client";
const c = createClient({
  projectId: "huh1e45n",
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
const UNKNOWN =
  /\bnot specified\b|\bnot stated\b|\bnot provided\b|\bnot listed\b|\bN\/A\b|\bnot explicitly\b/i;
const KNOWN =
  /burn time|how long.*burn|smell|fragrance|scent|batter|bulb|wattage|watt|outdoor|outside|weather|waterproof|assembl|material|made (?:of|from)|fabric|weight limit|hold|capacity|load|internal|inside|inner|dimension|size|measure|how (?:big|tall)|weigh|heavy|clean|care|maintain|warrant|guarantee|deliver|dispatch|shipping|colour|color|shade|finish|real flame|flame|candle type|mount|hang|fix|wall/i;
async function main() {
  const rows = await c.fetch(
    `*[_type=="product" && count(faqs)>0]{title,faqs}`,
  );
  const qs: string[] = [];
  for (const r of rows)
    for (const f of r.faqs ?? []) {
      if (!UNKNOWN.test(f.answer ?? "")) continue;
      const q = f.question ?? "";
      if (KNOWN.test(q)) continue;
      qs.push(q);
    }
  // normalise product names out to find patterns
  const norm = new Map<string, number>();
  for (const q of qs) {
    const k = q
      .replace(/\b[A-Z][a-zA-Z]*(\s+[A-Z&][a-zA-Z]*)*/g, "X")
      .replace(/\s+/g, " ")
      .trim();
    norm.set(k, (norm.get(k) ?? 0) + 1);
  }
  console.log(`"other" questions: ${qs.length}\n`);
  for (const [q, n] of [...norm].sort((a, b) => b[1] - a[1]).slice(0, 28))
    console.log(`  ${String(n).padStart(3)}  ${q.slice(0, 84)}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
