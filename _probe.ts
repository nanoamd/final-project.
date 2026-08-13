import { readFileSync } from "node:fs";
const xml = readFileSync(
  "/root/.claude/uploads/faaf1922-1604-5b81-b3ee-c4782f0da6af/8b6ef604-HillInteriorsDropship.xml",
  "utf8",
);
const blocks = xml.split("<Product>").slice(1);
const tag = (b: string, t: string) => {
  const m = new RegExp(`<${t}>([\\s\\S]*?)</${t}>`).exec(b);
  return m ? m[1]!.trim() : "";
};
const rows = blocks.map((b) => ({
  code: tag(b, "Code"),
  title: tag(b, "Title"),
  price: parseFloat(tag(b, "Price")) || 0,
  stock: parseInt(tag(b, "AvailableStock")) || 0,
  cats: tag(b, "Categories"),
}));
console.log("Anything with 'tree' in the title, in stock:");
const trees = rows.filter((r) => /\btree\b/i.test(r.title) && r.stock > 0);
for (const r of trees)
  console.log(
    `  ${r.code} £${r.price} stock ${r.stock} | ${r.title.slice(0, 52)} | ${r.cats.slice(0, 50)}`,
  );
console.log(`(${trees.length} found)`);
console.log(
  "\nGarland / wreath, in stock:",
  rows.filter((r) => /garland|wreath/i.test(r.title) && r.stock > 0).length,
);
