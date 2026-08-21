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
async function main() {
  const rows = await c.fetch(
    `*[_type=="product" && count(faqs)>0]{_id,title,faqs}`,
  );
  const topics = new Map<string, number>();
  let total = 0;
  for (const r of rows)
    for (const f of r.faqs ?? []) {
      if (!UNKNOWN.test(f.answer ?? "")) continue;
      total++;
      const q = (f.question ?? "").toLowerCase();
      const topic = /burn time|how long.*burn/.test(q)
        ? "burn time"
        : /smell|fragrance|scent/.test(q)
          ? "fragrance"
          : /batter/.test(q)
            ? "battery type"
            : /bulb|wattage|watt/.test(q)
              ? "bulb / wattage"
              : /outdoor|outside|weather|waterproof/.test(q)
                ? "outdoor suitability"
                : /assembl|self.assembly|put together/.test(q)
                  ? "assembly"
                  : /material|made (?:of|from)|fabric/.test(q)
                    ? "material"
                    : /weight limit|hold|capacity|load/.test(q)
                      ? "load capacity"
                      : /internal|inside|inner/.test(q)
                        ? "internal size"
                        : /dimension|size|measure|how (?:big|tall)/.test(q)
                          ? "overall size"
                          : /weigh|heavy/.test(q)
                            ? "weight"
                            : /clean|care|maintain/.test(q)
                              ? "care"
                              : /warrant|guarantee/.test(q)
                                ? "warranty"
                                : /deliver|dispatch|shipping/.test(q)
                                  ? "delivery"
                                  : /colour|color|shade|finish/.test(q)
                                    ? "colour / finish"
                                    : /real flame|flame|candle type/.test(q)
                                      ? "flame vs LED"
                                      : /mount|hang|fix|wall/.test(q)
                                        ? "mounting"
                                        : "other";
      topics.set(topic, (topics.get(topic) ?? 0) + 1);
    }
  console.log(`FAQ answers admitting ignorance: ${total}\n`);
  for (const [t, n] of [...topics].sort((a, b) => b[1] - a[1]))
    console.log(`  ${String(n).padStart(4)}  ${t}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
