/**
 * 28 published products still admitted a gap ("the specification does not
 * list/state/specify...") — a pattern flagged and supposedly closed out
 * earlier this session, but that earlier regex only matched "does not
 * mention/specify/indicate/include information" and missed the very common
 * "does not list" / "does not state" / "does not detail" / "does not
 * confirm" wording, which is why these survived. Found live on the site by
 * Damien, not caught by the earlier scan.
 *
 * Each fix below was read against the product's own live block text (dumped
 * by a throwaway script). Same standard as every earlier gap-admission
 * pass: where the whole section is 100% hedge with nothing else in it, the
 * section is dropped entirely; where a hedge clause sits next to a real
 * fact, only the hedge is removed and the fact stays, rewritten as a plain
 * statement.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-hedge-phrases-batch1.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-hedge-phrases-batch1.ts --apply
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
});

interface Block {
  _key: string;
  _type: string;
  style?: string;
  listItem?: string;
  level?: number;
  markDefs: unknown[];
  children: { _key: string; _type: string; marks: string[]; text: string }[];
}

function block(key: string, text: string, style = "normal"): Block {
  return {
    _key: key,
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: `${key}s`, _type: "span", marks: [], text }],
  };
}

function replaceSection(
  blocks: Block[],
  headingText: string,
  replacement: Block[],
): Block[] {
  const start = blocks.findIndex(
    (b) =>
      b.style === "h2" &&
      b.children.map((c) => c.text).join("") === headingText,
  );
  if (start === -1) throw new Error(`Heading not found: "${headingText}"`);
  let end = start + 1;
  while (end < blocks.length && blocks[end]?.style !== "h2") end++;
  return [...blocks.slice(0, start), ...replacement, ...blocks.slice(end)];
}

function setByContains(
  blocks: Block[],
  needle: string,
  newText: string,
): Block[] {
  const target = blocks.find((b) =>
    b.children.some((c) => c.text.includes(needle)),
  );
  if (!target) throw new Error(`Block containing "${needle}" not found`);
  return blocks.map((b) =>
    b._key === target._key
      ? {
          ...b,
          children: [
            {
              _key: `${target._key}s`,
              _type: "span",
              marks: [],
              text: newText,
            },
          ],
        }
      : b,
  );
}

interface Fix {
  id: string;
  title: string;
  apply: (blocks: Block[]) => Block[];
}

const FIXES: Fix[] = [
  {
    id: "premier-housewares-2200480",
    title: "Verdian Multi Coloured Circles DIY Wall Clock",
    apply: (b) => replaceSection(b, "Hanging and Fixings", []),
  },
  {
    id: "premier-housewares-2405802",
    title: "Rowan Two Seater Natural And Silver Woven Bamboo Small Sofa",
    apply: (b) => {
      let r = replaceSection(b, "What's in the Set", []);
      r = setByContains(
        r,
        "The specification does not state whether a cover is included",
        "For care, it is suggested to clean the woven surface gently with a damp cloth. Since natural wood may vary in character, appropriate care will ensure longevity. Separate cushions and store them indoors during harsh weather.",
      );
      return r;
    },
  },
  {
    id: "premier-housewares-2406046",
    title: "Goa Brown Rattan Hanging Chair",
    apply: (b) => replaceSection(b, "What's in the Set", []),
  },
  {
    id: "premier-housewares-2406636",
    title: "Lombok Rustic Chevron and Black Frame Media Unit",
    apply: (b) =>
      replaceSection(b, "Are any fixings included for the unit?", []),
  },
  {
    id: "premier-housewares-2406740",
    title: "Depok Rattan Side Table With Metal Legs",
    apply: (b) => replaceSection(b, "What's in the Set", []),
  },
  {
    id: "premier-housewares-2406745",
    title: "Depok Rattan and Metal Square Side Table",
    apply: (b) => replaceSection(b, "What's in the Set", []),
  },
  {
    id: "premier-housewares-2450049",
    title: "Goa Black Rattan Effect Double Hanging Chair With Grey Cushions",
    apply: (b) => {
      const r = replaceSection(b, "Weather Resistance and Leaving It Outside", [
        block("cushion-care-h", "Cushion Care", "h2"),
        block(
          "cushion-care-p",
          "Cushions should be stored dry when not in use.",
        ),
      ]);
      return r;
    },
  },
  {
    id: "premier-housewares-5502319",
    title: "Opus Woven Rope Footstool",
    apply: (b) =>
      setByContains(
        b,
        "is designed to stand alone",
        "The Opus Woven Rope Footstool is a standalone piece with no additional components.",
      ),
  },
  {
    id: "premier-housewares-5503056",
    title: "Meissa Gold Finish Pendant Wall Mirror",
    apply: (b) =>
      setByContains(
        b,
        "This mirror features a decorative hanging loop",
        "This mirror features a decorative hanging loop, allowing for easy installation on your wall. Source fixings suited to your wall type separately.",
      ),
  },
  {
    id: "premier-housewares-5503336",
    title: "Cristi Silver Finish Wall Mirror",
    apply: (b) => replaceSection(b, "Hanging and Fixings", []),
  },
  {
    id: "premier-housewares-5503350",
    title: "Remo Dual Lined Wall Mirror",
    apply: (b) => replaceSection(b, "Hanging and Fixings", []),
  },
  {
    id: "premier-housewares-5504031",
    title: "Jensen Rectangular Silver Wall Mirror",
    apply: (b) => replaceSection(b, "Hanging and Fixings", []),
  },
  {
    id: "premier-housewares-5504052",
    title: "Dimaro Antique Grey Wall Mirror",
    apply: (b) => replaceSection(b, "Hanging and Fixings", []),
  },
  {
    id: "premier-housewares-5505783",
    title: "Darnell Large Black Geometric Planter with Legs",
    apply: (b) => replaceSection(b, "Drainage and Planting", []),
  },
  {
    id: "premier-housewares-5505797",
    title: "Darnell White And Black Small Planter",
    apply: (b) =>
      setByContains(
        b,
        "This planter is designed with versatility in mind",
        "This planter is suitable for both indoor and outdoor use.",
      ),
  },
  {
    id: "premier-housewares-5505803",
    title: "Darnell Large Face Planter",
    apply: (b) =>
      setByContains(
        b,
        "This planter can be used both indoors and outdoors",
        "This planter can be used both indoors and outdoors.",
      ),
  },
  {
    id: "premier-housewares-5506425",
    title: "Darnell Round Brown Planter With Angular Legs",
    apply: (b) => replaceSection(b, "Drainage and Planting", []),
  },
  {
    id: "premier-housewares-5511398",
    title: "Skye Nickel Finish Rectangular Floor Lamp",
    apply: (b) =>
      setByContains(
        b,
        "The specification does not state whether this lamp is hard-wired",
        "Mains-wired fittings should be connected by a qualified electrician.",
      ),
  },
  {
    id: "premier-housewares-5511827",
    title: "Carta White Papier Mache Table Lamp",
    apply: (b) =>
      setByContains(
        b,
        "requires a Type A bulb with a maximum wattage of 25W",
        "The Carta White Papier Mache Table Lamp requires a Type A bulb with a maximum wattage of 25W.",
      ),
  },
  {
    id: "premier-housewares-5511870",
    title: "Carta Black and White Stripe Papier Mache Domed Pendant Light",
    apply: (b) => replaceSection(b, "Bulb Requirements", []),
  },
  {
    id: "premier-housewares-5528012",
    title: "Trento Round Rattan and Antique Gold Finish Coffee Table",
    apply: (b) => {
      let r = replaceSection(b, "What's in the Set", []);
      r = replaceSection(r, "Weather Resistance and Leaving It Outside", []);
      return r;
    },
  },
  {
    id: "premier-housewares-5528549",
    title: "Opus Linen Fabric and Woven Rope 3 Seat Sofa",
    apply: (b) => {
      let r = replaceSection(b, "What's in the Set", []);
      r = setByContains(
        r,
        "It comfortably seats three individuals",
        "It seats three people.",
      );
      return r;
    },
  },
  {
    id: "premier-housewares-5528627",
    title: "Manado Natural Rattan Long Bench with Cushion",
    apply: (b) => replaceSection(b, "What's in the Set", []),
  },
  {
    id: "product-aosom-842-337v00sr",
    title: "Portable Smokeless Wood-Burning Fire Pit, Silver",
    apply: (b) =>
      setByContains(
        b,
        "The manufacturer does not list any specific safety hardware",
        "Follow the guidelines in the instruction manual for safe usage.",
      ),
  },
  {
    id: "product-aosom-842-390v70bk",
    title: "11kW Freestanding Gas Patio Heater, Black",
    apply: (b) =>
      setByContains(
        b,
        "This outdoor heater is designed to efficiently operate using propane gas",
        "This outdoor heater runs on propane gas. Ensure you have the correct gas cylinder for use.",
      ),
  },
  {
    id: "product-aw-waterf-03",
    title: "Tabletop Water Feature - Golden Buddha & Pouring Pots",
    apply: (b) => {
      let r = replaceSection(b, "Installation and Siting", []);
      r = replaceSection(r, "Weather Resistance and Winter Care", []);
      return r;
    },
  },
  {
    id: "product-aw-waterf-15",
    title: "Tabletop Water Feature - Natural Rocks Formation",
    apply: (b) => replaceSection(b, "Water Capacity and Running It", []),
  },
  {
    id: "product-aw-waterf-23",
    title: "Pebble Wall Tabletop Water Feature with Crystal Ball",
    apply: (b) => replaceSection(b, "Weather Resistance and Winter Care", []),
  },
];

async function main() {
  const results: { id: string; title: string; ok: boolean; error?: string }[] =
    [];
  const transaction = client.transaction();
  let queued = 0;

  for (const fix of FIXES) {
    try {
      const doc = await client.fetch<{ description: Block[] } | null>(
        `*[_id == $id][0]{description}`,
        { id: fix.id },
      );
      if (!doc) {
        results.push({
          id: fix.id,
          title: fix.title,
          ok: false,
          error: "not found",
        });
        continue;
      }
      const newBlocks = fix.apply(doc.description);
      results.push({ id: fix.id, title: fix.title, ok: true });
      if (apply) {
        transaction.patch(fix.id, (p) => p.set({ description: newBlocks }));
        queued += 1;
      }
    } catch (error) {
      results.push({
        id: fix.id,
        title: fix.title,
        ok: false,
        error: String(error),
      });
    }
  }

  console.table(results);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    "docs/change-log/2026-09-01-fix-hedge-phrases-batch1.json",
    JSON.stringify({ apply, queued, results }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
