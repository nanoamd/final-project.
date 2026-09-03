/**
 * Batch 5: Storage & Shelving — three guides from the roadmap.
 *
 * The roadmap's original third item here was a bathroom vanity guide. The
 * catalogue was checked before writing anything: Bathroom Storage (11
 * products) is entirely baskets, wall shelves and storage caddies — there
 * is no vanity unit (a cabinet with a basin) anywhere in the catalogue,
 * confirmed by a sitewide title search that found exactly one "vanity"
 * product, a freestanding vanity mirror, not a cabinet. Writing a vanity
 * buying guide with nothing to link it to would be the thin-content
 * mistake this whole roadmap exists to avoid. Repurposed to the guide the
 * real stock actually supports: bathroom storage without built-in
 * cabinetry — same slot in the plan, honest subject.
 *
 * Also checked before writing: "Shelving" (20 products) is exclusively
 * open units — no cupboard-fronted piece anywhere in it. Closed storage
 * lives under Living Room / Office Storage instead, as door-fronted
 * sideboards. The open-vs-cupboard guide pulls from both rather than
 * pretending Shelving contains an answer to half its own question.
 *
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch5.ts
 *   pnpm tsx --env-file=.env.local scripts/create-buying-guides-batch5.ts --apply
 */
import { mkdirSync, writeFileSync } from "node:fs";

import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const token = process.env.SANITY_API_WRITE_TOKEN;
if (apply && !token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — refusing to --apply.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
  perspective: "raw",
});

const AUTHOR_ID = "author-kaiku-editorial";

function block(prefix: string, index: number, text: string, style = "normal") {
  return {
    _key: `${prefix}${index}`,
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: `${prefix}${index}s`, _type: "span", marks: [], text }],
  };
}

function table(
  prefix: string,
  index: number,
  caption: string,
  headers: string[],
  rows: string[][],
) {
  return {
    _key: `${prefix}${index}`,
    _type: "guideTable",
    caption,
    headers,
    rows: rows.map((cells, i) => ({
      _key: `${prefix}${index}r${i}`,
      _type: "guideTableRow",
      cells,
    })),
  };
}

interface GuideSpec {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  categoryId: string;
  relatedProductIds: string[];
  seo: { title: string; description: string };
  body: unknown[];
  faqs: [question: string, answer: string][];
}

const SHELVING_PRODUCT_IDS = [
  "premier-housewares-2406244", // Laxton 3 Tier Light Oak, open
  "premier-housewares-2406248", // Laxton 5 Tier Light Oak, open
  "premier-housewares-5501271", // Ulmus Grey Elm 4 Tier Bookshelf, open
  "premier-housewares-5501643", // Lyon Washed Grey Oak Large Bookcase with Ladder, open
  "premier-housewares-5528622", // Grenoble Brushed Brass Multi Tier, open
  "product-import-alto-shelf-unit-with-glass-shelves", // Alto Shelf Unit, glass, open
  "premier-housewares-5502400", // Midas Recycled Elm 4 Door Sideboard, cupboard
  "premier-housewares-5528695", // Lyon Rattan and Oak 4 Door Sideboard, cupboard
];

const BATHROOM_STORAGE_PRODUCT_IDS = [
  "premier-housewares-0507069", // Emery Matt Black Wire Tall Basket
  "premier-housewares-0507070", // Emery Matt Black Wire Basket
  "premier-housewares-0507595", // Vertex Copper Plated Basket
  "premier-housewares-0507598", // Vertex Hexagonal Basket
  "premier-housewares-2406650", // Arles Water Hyacinth Wall Shelf
  "premier-housewares-2406651", // Arles 3 Tier Water Hyacinth Storage Caddy
  "premier-housewares-5515084", // Batu Set of 2 Natural Rattan Baskets
  "product-aw-bts-02", // Natural Wooden Beer Barrel Storage Stool
];

const BEDROOM_STORAGE_PRODUCT_IDS = [
  "premier-housewares-2406147", // Bradbury Dark Oak Open Wardrobe
  "premier-housewares-2406148", // Bradbury Natural Oak Open Wardrobe
  "premier-housewares-5502407", // Kyra Grey Wash Elm Wardrobe
  "premier-housewares-5528694", // Lyon Rattan and Oak 2 Door Wardrobe
  "premier-housewares-5502838", // Salvar Natural Oak Chest of 5 Drawers
  "premier-housewares-5528469", // Sarter Black Mango Wood Chest of 4 Drawers
  "premier-housewares-5529162", // Salem Mango Wood Chest of 4 Drawers
  "premier-housewares-5529171", // Gaya Mango Wood Chest of 5 Drawers
];

const GUIDES: GuideSpec[] = [
  {
    id: "guide-shelving-how-many-open-vs-cupboard",
    title: "How many shelves do you need, and open or behind a door?",
    slug: "shelving-how-many-and-open-or-cupboard",
    excerpt:
      "About 23-26 average hardbacks per linear metre of shelf, packed solid — and real-world capacity, once you allow for gaps and uneven sizes, is more like 65-75% of that. Open shelving displays what's on it and needs tidy contents; a cupboard-fronted piece hides the mess for the same footprint. Which suits which room.",
    categoryId: "category-shelving",
    relatedProductIds: SHELVING_PRODUCT_IDS,
    seo: {
      title: "How Many Shelves Do You Need? Open vs Cupboard Guide | Kaiku",
      description:
        "~23-26 average hardbacks per linear metre of shelf, solid-packed — real-world capacity is 65-75% of that. Open shelving displays; a cupboard hides the mess. Which suits which room.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "The number to work from is roughly 23-26 average hardbacks per linear metre of shelf, packed solid, spine to spine — the common library-science rule of thumb. Real-world capacity is lower than that: allow gaps, bookends, and books of different heights, and 65-75% of the solid-packed figure is what a shelf actually holds in practice, not the full number.",
      );
      p(
        "Open or cupboard-fronted is a separate decision from how many shelves — it's about whether you want the contents on display or hidden, for the same footprint. What follows covers both.",
      );
      b.push(
        table(
          "b",
          n,
          "Shelf capacity, working figures",
          ["Measure", "Solid-packed", "Real-world (65-75%)"],
          [
            ["Per linear metre of shelf", "23-26 hardbacks", "15-19 hardbacks"],
            ["Per linear foot of shelf", "7-8 hardbacks", "5-6 hardbacks"],
          ],
        ),
      );
      n += 1;
      p("Rule one. Measure your own shelf run, don't guess it", "h2");
      p(
        "Multiply a unit's shelf width by however many shelves it has for the total linear run, then apply the real-world figure above rather than the solid-packed one — a shelf that's never touched again after the first tidy-up is worth planning for at capacity you'll actually use, not the maximum a library would pack it to.",
      );
      p(
        "Paperbacks and thin reference books shift the number in opposite directions — paperbacks pack slightly denser than hardbacks, oversized reference books noticeably less dense — so treat the figure above as a starting point for a mixed collection rather than an exact count for either extreme.",
      );
      p("Rule two. Open shelving displays; it also demands tidiness", "h2");
      p(
        "An open unit shows everything on it, which is exactly why it works well for books, considered objects, or anything that looks intentional lined up — and exactly why it looks cluttered the moment it's storing things that aren't meant to be seen. It suits a room where what goes on the shelf is also part of the decoration.",
      );
      p(
        "It's also the easier piece to fill gradually — a half-empty open shelf still looks like a shelf, where a half-empty cupboard behind a closed door doesn't cost you anything visually either way.",
      );
      p(
        "Rule three. A cupboard hides the same footprint's worth of mess",
        "h2",
      );
      p(
        "A door-fronted piece — a sideboard, in most of our own range — takes up similar floor space to an open unit of the same width and gives you the option most open shelving doesn't: storing things that don't need to look good, chargers and spare bedding and the things that accumulate in every home, behind a door rather than on display.",
      );
      p(
        "The trade-off is upkeep of a different kind — a cupboard hides mess rather than preventing it, so a fully crammed one can be its own problem the next time you need to find something specific inside it.",
      );
      p("Six open units and two closed cupboards, measured", "h2");
      p(
        "Sorted so the choice between open and closed is a straight comparison, not a guess from photos.",
      );
      b.push(
        table(
          "b",
          n,
          "Our shelving and sideboards, by type",
          ["Piece", "Width", "Tiers / doors", "Type"],
          [
            ["Laxton 3 Tier Light Oak Effect", "120cm", "3 open tiers", "Open"],
            ["Laxton 5 Tier Light Oak Effect", "120cm", "5 open tiers", "Open"],
            [
              "Ulmus Grey Elm Wood 4 Tier Bookshelf",
              "130cm",
              "4 open tiers",
              "Open",
            ],
            [
              "Lyon Washed Grey Oak Bookcase with Ladder",
              "308cm",
              "Multiple open tiers",
              "Open",
            ],
            [
              "Grenoble Brushed Brass Multi Tier",
              "110cm",
              "Multiple open tiers",
              "Open",
            ],
            [
              "Alto Shelf Unit with Glass Shelves",
              "80cm",
              "Multiple open tiers",
              "Open, glass",
            ],
            [
              "Midas Recycled Elm Wood Sideboard",
              "200cm",
              "4 doors",
              "Cupboard",
            ],
            [
              "Lyon Rattan and Oak Wood Sideboard",
              "160cm",
              "4 doors",
              "Cupboard",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "Work from 23-26 hardbacks per linear metre solid-packed, then apply 65-75% for real-world capacity with gaps and mixed sizes. Open shelving displays its contents and wants them to look intentional; a cupboard-fronted piece hides the same footprint's worth of mess behind a door instead.",
      );
      return b;
    })(),
    faqs: [
      [
        "How many books fit on a metre of shelf?",
        "About 23-26 average hardbacks packed solid, spine to spine — the common library rule of thumb. Real-world capacity, allowing for gaps and mixed sizes, is closer to 15-19 per metre.",
      ],
      [
        "Is open shelving or a cupboard better for a living room?",
        "Depends what's being stored. Open shelving suits books and objects meant to be seen and looks cluttered otherwise; a cupboard-fronted sideboard hides the same footprint's worth of mess behind a door, at the cost of not being able to see what's inside without opening it.",
      ],
      [
        "How much shelf space do I need for 200 books?",
        "At the real-world figure of roughly 15-19 hardbacks per metre, 200 books needs about 10-13 linear metres of shelf — which, split across a 5-tier unit around 120cm wide, is roughly two such units.",
      ],
      [
        "Does Kaiku sell cupboard-style shelving?",
        "Not under Shelving specifically, which is open units only — door-fronted storage in our range is sold as sideboards, under Living Room and Office Storage, and works for the same footprint if a closed cupboard is what you're after.",
      ],
      [
        "Do paperbacks take up less shelf space than hardbacks?",
        "Slightly less, yes — paperbacks pack a bit denser than the 23-26-per-metre hardback figure. Oversized reference books go the other way and take noticeably more space each, so a mixed collection sits somewhere in between.",
      ],
    ],
  },
  {
    id: "guide-bathroom-storage-ideas",
    title: "Bathroom storage without a fitted vanity",
    slug: "bathroom-storage-ideas",
    excerpt:
      "Straight answer first: we don't sell vanity units — cabinets with a basin built in. What we do sell for bathroom storage is baskets, wall shelves and storage caddies, and they solve a genuinely different problem: things you actually use daily, kept in reach, rather than things you want hidden behind a cabinet door.",
    categoryId: "category-bathroom-storage",
    relatedProductIds: BATHROOM_STORAGE_PRODUCT_IDS,
    seo: {
      title: "Bathroom Storage Ideas Without a Fitted Vanity | Kaiku",
      description:
        "We don't sell vanity units — here's what we do sell for bathroom storage: baskets, wall shelves and caddies for what you actually use daily, kept in reach rather than hidden.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "If you're after a vanity unit — a cabinet with a basin built in — we don't currently sell one; that's a fitted piece most bathrooms source alongside the plumbing itself, not something bought the way a shelf or a basket is. What we do sell solves a different, genuinely common problem: where to put the things you use every day without them living on every flat surface in the room.",
      );
      p(
        "Baskets, wall shelves and tiered caddies do a job a cabinet doesn't — they keep daily items in reach rather than shut away, which is exactly what you want for the things you actually reach for each morning rather than store and forget.",
      );
      p(
        "Rule one. In-reach storage and hidden storage solve different problems",
        "h2",
      );
      p(
        "A vanity cabinet is built for things you don't want to see — cleaning supplies, spare toiletries, the things a bathroom accumulates but doesn't need on display. A basket or open shelf is built for the opposite: things you use daily and want to grab without opening a door, which is most of what actually sits on a bathroom counter in practice.",
      );
      p(
        "This isn't a downgrade from a vanity, it's a different answer to a different part of the same overall problem — most bathrooms genuinely need both a hidden-storage answer and an in-reach one, and this range covers the second half.",
      );
      p(
        "Rule two. Wall-mounted storage buys back counter space a vanity would otherwise hold",
        "h2",
      );
      p(
        "A wall-hung shelf or tiered caddy stores things above the counter or beside the basin rather than on it, which matters most in a smaller bathroom where floor and counter space are the actual constraint, not storage volume itself. It's also the easier retrofit — no plumbing or fitted carpentry, just a wall fixing.",
      );
      p(
        "Baskets do the same job at floor or shelf level instead of the wall — towels, spare toilet roll, anything bulkier than what a small wall caddy comfortably holds.",
      );
      p(
        "Rule three. Material matters more here than almost anywhere else in the house",
        "h2",
      );
      p(
        "A bathroom is the one room in the house where humidity is a constant rather than an occasional problem, which rules out anything that swells, warps or grows mould with regular damp exposure. Water hyacinth and rattan, woven tightly, cope with bathroom humidity far better than untreated wood, and metal wire baskets don't absorb moisture at all — both are why they dominate this category rather than solid timber shelving.",
      );
      p("Our bathroom storage, by piece", "h2");
      p(
        "Every piece here is either wall-mounted or freestanding — nothing plumbed in, nothing that needs a fitter.",
      );
      b.push(
        table(
          "b",
          n,
          "Our bathroom storage",
          ["Piece", "Type", "Best for"],
          [
            [
              "Emery Matt Black Wire Tall Basket",
              "Wire basket",
              "Towels, floor-standing",
            ],
            [
              "Emery Matt Black Wire Basket",
              "Wire basket",
              "Smaller items, counter or floor",
            ],
            [
              "Vertex Copper Plated Basket",
              "Metal basket",
              "Toiletries, decorative",
            ],
            ["Vertex Hexagonal Basket", "Metal basket", "Smaller items"],
            [
              "Arles Water Hyacinth Wall Shelf",
              "Wall-mounted shelf",
              "In-reach daily items, above the counter",
            ],
            [
              "Arles 3 Tier Water Hyacinth Storage Caddy",
              "Tiered caddy",
              "Toiletries, tiered for volume",
            ],
            [
              "Batu Set of 2 Natural Rattan Baskets",
              "Rattan baskets",
              "Towels or spare toiletries",
            ],
            [
              "Natural Wooden Beer Barrel Storage Stool",
              "Stool with storage",
              "Seating that doubles as storage",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "No vanity units in the range — that's a fitted piece most bathrooms source separately. What we sell instead is in-reach storage: baskets, wall shelves and caddies in humidity-tolerant materials, for the daily items a cabinet would otherwise hide, using wall space and floor space a vanity wouldn't free up.",
      );
      return b;
    })(),
    faqs: [
      [
        "Does Kaiku sell bathroom vanity units?",
        "No — a vanity unit (a cabinet with a basin built in) is a fitted piece most bathrooms source alongside the plumbing itself. What we sell is unfitted storage: baskets, wall shelves and caddies for daily items kept in reach rather than hidden behind a cabinet door.",
      ],
      [
        "What bathroom storage doesn't need a fitted cabinet?",
        "Wall-mounted shelves and caddies, and freestanding baskets — none need plumbing or built-in carpentry, just a wall fixing or floor space. They suit daily items you want in reach rather than things you'd store behind a closed door.",
      ],
      [
        "What material holds up best in a humid bathroom?",
        "Tightly woven water hyacinth and rattan tolerate regular humidity well, and metal wire doesn't absorb moisture at all. Untreated solid wood is the one to avoid — it swells and can develop mould with sustained damp exposure.",
      ],
      [
        "How do you add bathroom storage without renovating?",
        "Wall-mounted shelves and tiered caddies are the easiest retrofit — no plumbing, just a wall fixing — and they buy back counter and floor space by moving daily items up onto the wall instead of leaving them on every flat surface.",
      ],
      [
        "Is basket storage a good alternative to a bathroom cabinet?",
        "For a different purpose, yes — baskets suit things you want to see and grab quickly, like towels, rather than things you want fully hidden. For anything you specifically want out of sight, a cabinet still does that job better; the two solve different halves of the same storage problem.",
      ],
    ],
  },
  {
    id: "guide-chest-of-drawers-vs-wardrobe",
    title: "Chest of drawers or wardrobe — or both?",
    slug: "chest-of-drawers-vs-wardrobe",
    excerpt:
      "A wardrobe stores what needs to hang — coats, dresses, anything that creases folded. A chest of drawers stores what doesn't — folded clothes, underwear, anything better kept flat. Most bedrooms genuinely need both rather than a bigger version of one; eight of our own pieces measured, hanging and folded storage side by side.",
    categoryId: "category-bedroom-storage",
    relatedProductIds: BEDROOM_STORAGE_PRODUCT_IDS,
    seo: {
      title: "Chest of Drawers or Wardrobe? Bedroom Storage Guide | Kaiku",
      description:
        "A wardrobe stores what needs to hang; a chest of drawers stores what doesn't. Most bedrooms need both rather than more of one. 8 real pieces measured, hanging vs folded storage.",
    },
    body: (() => {
      const b: unknown[] = [];
      let n = 0;
      const p = (text: string, style = "normal") => {
        b.push(block("b", n, text, style));
        n += 1;
      };
      p(
        "The two aren't really competing for the same clothes — a wardrobe stores what needs to hang to avoid creasing (coats, shirts, dresses), and a chest of drawers stores what doesn't (folded jumpers, underwear, t-shirts). Most bedrooms need real capacity in both categories, which is why the common mistake is buying a bigger version of whichever one you already have rather than the one you're actually short of.",
      );
      p(
        "What follows is how to tell which you're short of, and eight of our own pieces measured — hanging space against drawer space, side by side.",
      );
      b.push(
        table(
          "b",
          n,
          "What goes where",
          ["Item type", "Wardrobe", "Chest of drawers"],
          [
            [
              "Coats, dresses, tailored shirts",
              "Yes — needs hanging",
              "No — creases",
            ],
            [
              "Jumpers, t-shirts, underwear",
              "Wastes hanging space",
              "Yes — folds flat",
            ],
            ["Shoes, bags", "Floor or shelf space inside", "No"],
            [
              "Spare bedding",
              "Top shelf, if there is one",
              "Bottom drawer, if deep enough",
            ],
          ],
        ),
      );
      n += 1;
      p("Rule one. Count what you actually own before buying either", "h2");
      p(
        "The honest way to tell which you're short of is to count hangers currently in use against how full your existing drawers are — most people already know the answer once they actually look, rather than guessing from how the bedroom feels. A wardrobe bought to solve a folded-clothes problem doesn't solve it; the clothes just move to a different form of not-quite-fitting.",
      );
      p(
        "This matters more than either piece's total 'storage volume' as advertised — a wardrobe with generous hanging rail and a chest with generous drawers can have similar overall capacity and still leave you short, if what you actually own is mismatched to the split between them.",
      );
      p(
        "Rule two. An open wardrobe trades a door for visibility and airflow",
        "h2",
      );
      p(
        "An open wardrobe — rail and shelving with no doors — shows everything hanging on it, which works well for a considered, curated wardrobe and less well for one that's genuinely just storage. It also airs better than a closed cabinet, which matters for anything stored slightly damp or for a room prone to condensation.",
      );
      p(
        "A door-fronted wardrobe hides the same rail and shelving, at the cost of needing floor clearance to actually open the doors — worth checking against the room's layout before assuming any wardrobe fits where an open one would.",
      );
      p(
        "Rule three. A chest's drawer count matters more than its total height",
        "h2",
      );
      p(
        "More drawers, even in the same total height, generally beats fewer bigger ones for actually finding things — a 5-drawer chest sorts by category (socks, t-shirts, jumpers, and so on) in a way a 3-drawer chest with the same volume can't. The trade-off is that more, shallower drawers hold less of any one thing than fewer, deeper ones.",
      );
      p(
        "This is also why a chest's advertised drawer count is worth checking against what's actually going in it — bulky folded jumpers want fewer, deeper drawers; smaller folded items sort better across more, shallower ones.",
      );
      p("Eight of our pieces, hanging and folded storage compared", "h2");
      p(
        "Wardrobes first, then chests of drawers, so the two types of storage are easy to compare directly rather than reading as one long list.",
      );
      b.push(
        table(
          "b",
          n,
          "Our wardrobes and chests of drawers, measured",
          ["Piece", "Width", "Storage"],
          [
            [
              "Bradbury Dark Oak Effect Open Wardrobe",
              "84cm",
              "Open rail and shelving",
            ],
            [
              "Bradbury Natural Oak Effect Open Wardrobe",
              "84cm",
              "Open rail and shelving",
            ],
            [
              "Kyra Grey Wash Elm Wood Wardrobe",
              "95cm",
              "Door-fronted, rail and shelving",
            ],
            [
              "Lyon Rattan and Oak Wood 2 Door Wardrobe",
              "92cm",
              "Door-fronted, rail and shelving",
            ],
            [
              "Salvar Natural Oak and Elm Chest of 5 Drawers",
              "70cm",
              "5 drawers",
            ],
            [
              "Sarter Black Mango Wood Chest of 4 Drawers",
              "98cm",
              "4 drawers, wider/shallower",
            ],
            ["Salem Mango Wood Chest of 4 Drawers", "85cm", "4 drawers"],
            [
              "Gaya Mango Wood Chest of 5 Drawers",
              "60cm",
              "5 drawers, narrower/deeper",
            ],
          ],
        ),
      );
      n += 1;
      p("The short version", "h2");
      p(
        "A wardrobe stores what needs to hang; a chest of drawers stores what doesn't. Count what you actually own before buying either, since most bedrooms are short of a specific type of storage rather than storage in general. An open wardrobe shows and airs its contents; a door-fronted one hides them but needs clearance to open. More drawers sorts better than fewer bigger ones for the same total capacity.",
      );
      return b;
    })(),
    faqs: [
      [
        "Do I need a wardrobe or a chest of drawers?",
        "Most bedrooms need both, for different clothes — a wardrobe for anything that needs to hang to avoid creasing, a chest of drawers for anything that folds flat. Count what you actually own in each category before assuming you need a bigger version of whichever you already have.",
      ],
      [
        "Is an open wardrobe worse than one with doors?",
        "Not worse, just different — an open wardrobe airs better and suits a curated, considered wardrobe on display. A door-fronted one hides the same rail and shelving, at the cost of needing floor clearance to open the doors.",
      ],
      [
        "How many drawers should a chest of drawers have?",
        "More drawers generally sorts better than fewer at the same total height — a 5-drawer chest lets you separate categories (socks, t-shirts, jumpers) in a way a 3-drawer chest of the same volume can't. Fewer, deeper drawers suit bulkier folded items better.",
      ],
      [
        "Can a chest of drawers replace a wardrobe?",
        "Not for anything that needs to hang — coats, dresses and tailored shirts crease if folded and stored in a drawer. A chest handles folded clothing well; hanging storage is a genuinely separate need it doesn't cover.",
      ],
      [
        "Does an open wardrobe need more space than a closed one?",
        "About the same footprint for the rail and shelving itself, but a closed wardrobe needs extra clearance in front for the doors to open, which an open wardrobe doesn't require at all.",
      ],
    ],
  },
];

async function main() {
  const existing = await client.fetch<string[]>(
    `*[_type=="buyingGuide" && slug.current in $slugs].slug.current`,
    { slugs: GUIDES.map((g) => g.slug) },
  );
  if (existing.length)
    console.log(`Already present, skipping: ${existing.join(", ")}`);

  const results: Record<string, unknown>[] = [];

  for (const guide of GUIDES) {
    if (existing.includes(guide.slug)) continue;

    const chars = JSON.stringify(guide.body).length;
    console.log(`\n${guide.title}`);
    console.log(
      `   /learn/${guide.slug}   ${guide.body.length} body blocks, ~${chars} chars   ${guide.faqs.length} FAQs   ${guide.relatedProductIds.length} related products`,
    );

    results.push({
      slug: guide.slug,
      title: guide.title,
      bodyBlocks: guide.body.length,
      faqs: guide.faqs.length,
      relatedProducts: guide.relatedProductIds.length,
    });

    if (!apply) continue;

    await client.createOrReplace({
      _id: guide.id,
      _type: "buyingGuide",
      title: guide.title,
      slug: { _type: "slug", current: guide.slug },
      excerpt: guide.excerpt,
      body: guide.body,
      faqs: guide.faqs.map(([question, answer], i) => ({
        _key: `faq-${i}`,
        _type: "faqEntry",
        question,
        answer,
      })),
      author: { _type: "reference", _ref: AUTHOR_ID },
      relatedCategory: { _type: "reference", _ref: guide.categoryId },
      relatedProducts: guide.relatedProductIds.map((id, i) => ({
        _key: `rp-${i}`,
        _type: "reference",
        _ref: id,
      })),
      publishedAt: new Date().toISOString(),
      seo: {
        _type: "seo",
        metaTitle: guide.seo.title,
        metaDescription: guide.seo.description,
      },
    });
    console.log(`   created ${guide.id}`);
  }

  console.log(
    `\n${apply ? "Created" : "Would create"} ${results.length} buying guides.`,
  );

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-03-create-buying-guides-batch5.json",
    `${JSON.stringify({ apply, results }, null, 2)}\n`,
  );

  if (!apply) console.log("\nDry run — re-run with --apply.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
