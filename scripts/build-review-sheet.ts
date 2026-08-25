/**
 * Builds the draft review sheet — a single self-contained page for deciding what
 * out of the draft pile Kaiku actually sells.
 *
 * Damien, after the imports had run: "theres so many products constantly getting
 * shuffled so its so hard to concentrate and get through them... we need to go
 * through this and review every product much quicker but its hard when we have
 * so many products we need a better workflow."
 *
 * Reviewing 865 drafts one at a time in Studio is the workflow that produced
 * that sentence. Three things here are meant to fix it:
 *
 * 1. **Variants collapse.** Nine "Luxe Collection Natural Glow 3x4 / 3x6 / 3x8"
 *    LED candles are one decision, not nine. Families are grouped by title with
 *    the size and colour words stripped, so the sheet has 637 rows rather than
 *    865.
 * 2. **A recommendation on every row**, from checkable signals only — photo
 *    count, whether dimensions were recorded, whether the piece is a novelty or
 *    battery-LED item, how many variants share one design. Taste stays Damien's;
 *    this only removes the rows where the answer is obvious.
 * 3. **A stable order that never shuffles.** Category alphabetically, then title
 *    alphabetically. Re-running this on a changed catalogue leaves every
 *    surviving row where it was, so a half-finished pass can be resumed.
 *
 * Photographs are embedded as data URIs because a published artifact's CSP
 * blocks remote images — 112px WebP crops, which is the whole catalogue in under
 * a megabyte.
 *
 * Nothing here writes to Sanity. It produces a page and a list of ids to act on,
 * which is deliberate: deleting a few hundred products is not a thing a report
 * should do as a side effect.
 *
 *   pnpm tsx --env-file=.env.local scripts/build-review-sheet.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@sanity/client";

const OUT_DIR =
  process.env.KAIKU_REVIEW_OUT ??
  "/tmp/claude-0/-home-user-final-project-/faaf1922-1604-5b81-b3ee-c4782f0da6af/scratchpad";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

interface Draft {
  _id: string;
  title: string;
  cat: string | null;
  supplier: string | null;
  photo: string | null;
  photos: number;
  hasDims: boolean;
  costPrice?: number | null;
  colour?: string | null;
  materialTags?: string[] | null;
  sourceUrl?: string | null;
}

type Verdict = "KEEP" | "THIN" | "CHECK" | "BIN";

interface Family {
  cat: string;
  verdict: Verdict;
  reason: string;
  items: Draft[];
  thumb: string | null;
}

/**
 * Off-brand for a range whose own brief says "premium, calm, considered" — a
 * duck-feet plant stand and a cupcake wall clock are perfectly good products
 * and belong in a different shop.
 */
const NOVELTY =
  /duck|quackpot|cupcake|gnome|flamingo|unicorn|owl\b|hare|sloth|alpaca|meerkat|giraffe|elephant|labrador|pug|highland cow|butterfly|\bheart\b|\blove\b|christmas|santa|snowman|noel|xmas|\bdiy\b|kids|children|neon|slogan|novelty|football|gin\b|prosecco|cactus face|face planter/i;
/** Battery imitation candles read as budget however they are photographed. */
const LED =
  /\bled\b|battery|light up|pre-?lit|flickering|fairy light|tealight candle|wax candle/i;

/** Words that separate one variant from another rather than one product from another. */
const VARIANT_WORDS =
  /\b(small|medium|large|extra|mini|tall|short|round|square|rectangular|set of \d+|set|pair|s\/\d+|\d+(\.\d+)? ?x ?\d+(\.\d+)?|\d+cm|\d+ ?(cm|mm|kg)|black|white|cream|ivory|grey|gray|gold|silver|bronze|brass|natural|green|blue|brown|pink|red|sage|taupe|stone|antique|rustic|distressed|light|dark|two|three|1|2|3|4|5|6|8|9|12)\b/gi;

const stripKaiku = (t: string) => t.replace(/\s*\|\s*Kaiku.*$/i, "");
const familyKey = (t: string) =>
  stripKaiku(t)
    .toLowerCase()
    .replace(VARIANT_WORDS, " ")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function judge(items: Draft[]): { verdict: Verdict; reason: string } {
  const titles = items.map((i) => stripKaiku(i.title));
  const photos = Math.max(...items.map((i) => i.photos ?? 0));
  if (titles.some((t) => NOVELTY.test(t)))
    return {
      verdict: "BIN",
      reason: "Novelty or seasonal piece — off-brand for a calm premium range",
    };
  if (titles.some((t) => LED.test(t)))
    return {
      verdict: "BIN",
      reason: "Battery/LED imitation candle — reads budget, not premium",
    };
  if (photos === 0) return { verdict: "BIN", reason: "No photographs" };
  if (items.length >= 3)
    return {
      verdict: "THIN",
      reason: `${items.length} size or colour variants of one design — keep the best one or two`,
    };
  if (photos === 1)
    return {
      verdict: "CHECK",
      reason: "Only one photograph — thin product page",
    };
  return {
    verdict: "KEEP",
    reason: `${photos} photographs${items[0]!.hasDims ? ", dimensions recorded" : ", no dimensions recorded"}`,
  };
}

/** A 112px WebP crop, inlined — a published artifact cannot fetch remote images. */
async function thumbnail(url: string | null): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(`${url}?w=112&h=112&fit=crop&fm=webp&q=55`);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:image/webp;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

const escape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const VERDICT_ORDER: Verdict[] = ["BIN", "THIN", "CHECK", "KEEP"];
const VERDICT_LABEL: Record<Verdict, string> = {
  BIN: "Bin",
  THIN: "Thin out",
  CHECK: "Check",
  KEEP: "Keep",
};

function page(families: Family[]): string {
  const products = families.reduce((n, f) => n + f.items.length, 0);
  const tally = new Map<Verdict, number>();
  for (const f of families)
    tally.set(f.verdict, (tally.get(f.verdict) ?? 0) + f.items.length);

  const cats = [...new Set(families.map((f) => f.cat))].sort();

  const rows = cats
    .map((cat) => {
      const inCat = families.filter((f) => f.cat === cat);
      const catProducts = inCat.reduce((n, f) => n + f.items.length, 0);
      return `
<section class="cat" data-cat="${escape(cat)}">
  <h2 class="cat-head">
    <span class="cat-name">${escape(cat.replace(/-/g, " "))}</span>
    <span class="cat-count">${inCat.length} designs · ${catProducts} drafts</span>
  </h2>
  <ul class="rows">
    ${inCat
      .map((f) => {
        const lead = f.items[0]!;
        const ids = f.items.map((i) => i._id).join(" ");
        const facts = [
          f.items.length > 1 ? `${f.items.length} variants` : null,
          lead.supplier,
          lead.colour,
          (lead.materialTags ?? []).slice(0, 2).join(" / ") || null,
          lead.hasDims ? null : "no dimensions",
        ]
          .filter(Boolean)
          .join(" · ");
        return `
    <li class="row" data-verdict="${f.verdict}" data-ids="${escape(ids)}">
      <label class="pick">
        <input type="checkbox" class="cb" aria-label="Select ${escape(stripKaiku(lead.title))}">
      </label>
      ${
        f.thumb
          ? `<img class="thumb" src="${f.thumb}" alt="" loading="lazy" width="56" height="56">`
          : `<span class="thumb thumb--empty" aria-hidden="true"></span>`
      }
      <div class="body">
        <p class="title">${escape(stripKaiku(lead.title))}</p>
        <p class="facts">${escape(facts)}</p>
        <p class="reason">${escape(f.reason)}</p>
        ${
          f.items.length > 1
            ? `<details class="variants"><summary>${f.items.length} variants</summary><ul>${f.items
                .map((i) => `<li>${escape(stripKaiku(i.title))}</li>`)
                .join("")}</ul></details>`
            : ""
        }
      </div>
      <span class="chip chip--${f.verdict.toLowerCase()}">${VERDICT_LABEL[f.verdict]}</span>
    </li>`;
      })
      .join("")}
  </ul>
</section>`;
    })
    .join("");

  return `<title>Kaiku Draft Triage</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Geist:wght@400;500;600&display=swap">
<style>
:root{
  --canvas:#f4f2ed; --paper:#ffffff; --sand:#ece2d4; --line:#e6e2d9;
  --ink:#1b1b1d; --graphite:#48474a; --muted:#6f6d70; --brass:#c65a2c;
  --keep:#43654c; --thin:#8a6320; --check:#4a4a52; --bin:#9c3f32;
  --keep-bg:#e7eee8; --thin-bg:#f6ecd8; --check-bg:#eceaea; --bin-bg:#f6e3df;
}
@media (prefers-color-scheme: dark){
  :root:not([data-theme="light"]){
    --canvas:#161618; --paper:#1e1e21; --sand:#2a2724; --line:#2f2e31;
    --ink:#f0eee9; --graphite:#c3c0bb; --muted:#928f8b; --brass:#e0783f;
    --keep:#8fc09c; --thin:#dcb96e; --check:#b3b0b8; --bin:#e39184;
    --keep-bg:#22302a; --thin-bg:#332a1a; --check-bg:#26262a; --bin-bg:#35211f;
  }
}
:root[data-theme="dark"]{
  --canvas:#161618; --paper:#1e1e21; --sand:#2a2724; --line:#2f2e31;
  --ink:#f0eee9; --graphite:#c3c0bb; --muted:#928f8b; --brass:#e0783f;
  --keep:#8fc09c; --thin:#dcb96e; --check:#b3b0b8; --bin:#e39184;
  --keep-bg:#22302a; --thin-bg:#332a1a; --check-bg:#26262a; --bin-bg:#35211f;
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--canvas); color:var(--ink);
  font-family:Geist,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  font-size:15px; line-height:1.5;
}
.wrap{max-width:900px;margin:0 auto;padding:32px 20px 120px}
header h1{
  font-family:Fraunces,Georgia,serif; font-weight:600;
  font-size:clamp(1.7rem,4vw,2.4rem); line-height:1.1; margin:0 0 8px;
  text-wrap:balance; letter-spacing:-0.01em;
}
header .lede{color:var(--graphite);margin:0 0 4px;max-width:62ch}
header .meta{color:var(--muted);font-size:13px;margin:0}
.bar{
  position:sticky; top:0; z-index:5; margin:24px 0 8px;
  background:var(--canvas); padding:12px 0; border-bottom:1px solid var(--line);
  display:flex; flex-wrap:wrap; gap:8px; align-items:center;
}
.filter{
  font:inherit; font-size:13px; cursor:pointer; border:1px solid var(--line);
  background:var(--paper); color:var(--graphite); border-radius:999px;
  padding:6px 13px; display:inline-flex; gap:7px; align-items:center;
}
.filter:hover{border-color:var(--brass)}
.filter[aria-pressed="true"]{background:var(--ink);color:var(--canvas);border-color:var(--ink)}
.filter .n{font-variant-numeric:tabular-nums;opacity:.75}
.filter:focus-visible,.cb:focus-visible,summary:focus-visible{outline:2px solid var(--brass);outline-offset:2px}
.cat{margin:28px 0 0}
.cat-head{
  display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  font-family:Fraunces,Georgia,serif;font-weight:600;font-size:1.05rem;
  margin:0 0 10px;padding-bottom:6px;border-bottom:1px solid var(--line);
  text-transform:capitalize;
}
.cat-count{font-family:Geist,sans-serif;font-size:12px;font-weight:400;color:var(--muted);
  font-variant-numeric:tabular-nums;text-transform:none;white-space:nowrap}
.rows{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
.row{
  display:grid;grid-template-columns:auto 56px 1fr auto;gap:12px;align-items:start;
  background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:10px 12px;
}
.row.is-picked{border-color:var(--brass);box-shadow:inset 3px 0 0 var(--brass)}
.pick{display:flex;align-items:center;padding-top:2px}
.cb{width:17px;height:17px;accent-color:var(--brass);cursor:pointer;margin:0}
.thumb{width:56px;height:56px;border-radius:5px;object-fit:cover;background:var(--sand);display:block}
.thumb--empty{background:var(--sand)}
.body{min-width:0}
.title{margin:0;font-weight:500;font-size:14px;line-height:1.35}
.facts{margin:3px 0 0;font-size:12px;color:var(--muted)}
.reason{margin:3px 0 0;font-size:12px;color:var(--graphite)}
.variants{margin-top:5px;font-size:12px}
.variants summary{cursor:pointer;color:var(--brass)}
.variants ul{margin:5px 0 0;padding-left:16px;color:var(--muted)}
.chip{
  font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;
  padding:4px 9px;border-radius:999px;white-space:nowrap;align-self:start;
}
.chip--keep{background:var(--keep-bg);color:var(--keep)}
.chip--thin{background:var(--thin-bg);color:var(--thin)}
.chip--check{background:var(--check-bg);color:var(--check)}
.chip--bin{background:var(--bin-bg);color:var(--bin)}
.row[hidden]{display:none}
.cat[hidden]{display:none}
.tray{
  position:fixed;left:0;right:0;bottom:0;z-index:10;background:var(--paper);
  border-top:1px solid var(--line);padding:12px 20px;
  display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;
}
.tray p{margin:0;font-size:13px;color:var(--graphite);font-variant-numeric:tabular-nums}
.tray button{
  font:inherit;font-size:13px;cursor:pointer;border-radius:6px;padding:7px 14px;
  border:1px solid var(--ink);background:var(--ink);color:var(--canvas);
}
.tray button.ghost{background:transparent;color:var(--ink)}
.tray[hidden]{display:none}
@media (max-width:560px){
  .row{grid-template-columns:auto 48px 1fr;}
  .thumb{width:48px;height:48px}
  .chip{grid-column:3;justify-self:start;margin-top:2px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
</style>

<div class="wrap">
<header>
  <h1>What Kaiku actually sells</h1>
  <p class="lede">Every unpublished draft, one row per design rather than one per size, with a recommendation from checkable facts only. The judgement calls are still yours — this just clears the rows where the answer is obvious.</p>
  <p class="meta">${products} drafts · ${families.length} distinct designs · order is fixed, so a half-finished pass can be picked up where you left it</p>
</header>

<div class="bar" role="group" aria-label="Filter by recommendation">
  <button class="filter" data-f="ALL" aria-pressed="true">All <span class="n">${families.length}</span></button>
  ${VERDICT_ORDER.map(
    (v) =>
      `<button class="filter" data-f="${v}" aria-pressed="false">${VERDICT_LABEL[v]} <span class="n">${tally.get(v) ?? 0}</span></button>`,
  ).join("")}
</div>

${rows}
</div>

<div class="tray" hidden>
  <p><strong class="tray-n">0</strong> selected</p>
  <button class="copy">Copy the list</button>
  <button class="ghost clear">Clear</button>
</div>

<script>
(function(){
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'));
  var filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
  var tray = document.querySelector('.tray');
  var trayN = document.querySelector('.tray-n');

  filters.forEach(function(btn){
    btn.addEventListener('click', function(){
      var f = btn.dataset.f;
      filters.forEach(function(b){ b.setAttribute('aria-pressed', String(b === btn)); });
      rows.forEach(function(r){ r.hidden = f !== 'ALL' && r.dataset.verdict !== f; });
      document.querySelectorAll('.cat').forEach(function(sec){
        var visible = sec.querySelectorAll('.row:not([hidden])').length;
        sec.hidden = visible === 0;
      });
    });
  });

  function refresh(){
    var picked = rows.filter(function(r){ return r.querySelector('.cb').checked; });
    trayN.textContent = String(picked.length);
    tray.hidden = picked.length === 0;
    return picked;
  }

  rows.forEach(function(r){
    var cb = r.querySelector('.cb');
    cb.addEventListener('change', function(){
      r.classList.toggle('is-picked', cb.checked);
      refresh();
    });
  });

  document.querySelector('.copy').addEventListener('click', function(){
    var picked = rows.filter(function(r){ return r.querySelector('.cb').checked; });
    var lines = picked.map(function(r){
      return r.querySelector('.title').textContent + '  [' + r.dataset.ids + ']';
    });
    var text = lines.join('\\n');
    var btn = this;
    function done(){ btn.textContent = 'Copied'; setTimeout(function(){ btn.textContent = 'Copy the list'; }, 1600); }
    if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done, function(){ window.prompt('Copy this:', text); }); }
    else { window.prompt('Copy this:', text); }
  });

  document.querySelector('.clear').addEventListener('click', function(){
    rows.forEach(function(r){
      var cb = r.querySelector('.cb');
      cb.checked = false; r.classList.remove('is-picked');
    });
    refresh();
  });
})();
</script>`;
}

async function main() {
  const drafts = await client.fetch<Draft[]>(
    `*[_type == "product" && _id in path("drafts.**")]{
      _id, title, "cat": category->slug.current, "supplier": supplier->name,
      "photo": gallery[0].asset->url, "photos": count(gallery),
      "hasDims": defined(dimensions), costPrice,
      "colour": primaryColour, materialTags, sourceUrl
    }`,
  );
  console.log(`${drafts.length} drafts.`);

  const grouped = new Map<string, Draft[]>();
  for (const draft of drafts) {
    const key = `${draft.cat ?? "uncategorised"}::${familyKey(draft.title)}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(draft);
  }

  const families: Family[] = [];
  for (const items of grouped.values()) {
    items.sort((a, b) => a.title.localeCompare(b.title));
    const { verdict, reason } = judge(items);
    families.push({
      cat: items[0]!.cat ?? "uncategorised",
      verdict,
      reason,
      items,
      thumb: null,
    });
  }
  // Stable forever: category, then the lead product's title.
  families.sort(
    (a, b) =>
      a.cat.localeCompare(b.cat) ||
      a.items[0]!.title.localeCompare(b.items[0]!.title),
  );
  console.log(`${families.length} distinct designs. Fetching thumbnails…`);

  let cursor = 0;
  await Promise.all(
    Array.from({ length: 12 }, async () => {
      while (cursor < families.length) {
        const family = families[cursor++]!;
        family.thumb = await thumbnail(family.items[0]!.photo);
      }
    }),
  );

  await mkdir(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, "kaiku-draft-triage.html");
  await writeFile(file, page(families), "utf8");

  const tally = new Map<Verdict, number>();
  for (const f of families)
    tally.set(f.verdict, (tally.get(f.verdict) ?? 0) + f.items.length);
  console.log(`\nWrote ${file}`);
  for (const v of VERDICT_ORDER)
    console.log(`  ${VERDICT_LABEL[v].padEnd(9)} ${tally.get(v) ?? 0} drafts`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
