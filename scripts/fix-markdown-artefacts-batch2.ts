/**
 * Second markdown/template-artefact cleanup batch — the 8 published
 * products still carrying markdown or raw template syntax as literal text,
 * found in the post-emergency re-audit on 1 September.
 *
 * Six are simple, mechanical fixes: literal `*`/`- **bold**` markdown
 * characters stripped from otherwise-fine sentences (dimension bullet
 * lists in FAQ answers, a multiplication sign typed as an asterisk, three
 * bulleted feature lines in a bed-frame description).
 *
 * "Soft Squiggly Mirror" is not a mechanical fix — its description has raw
 * generator scaffolding (`bullets':['...']},{`) AND actual garbled,
 * nonsensical fragments ("oronymyill…", "al coom soundsw oour inn d") mixed
 * through it, well past what a surgical strip could repair honestly. Fully
 * rewritten instead, from the product's own real `dimensions`/`weight`
 * fields (30.5 × 22.5 × 2.3cm, 0.58kg) and the safe, verifiable facts
 * already in its title (chunky frame, royal blue, handcrafted) — nothing
 * from the corrupted prose carried over.
 *
 *   pnpm tsx --env-file=.env.local scripts/fix-markdown-artefacts-batch2.ts
 *   pnpm tsx --env-file=.env.local scripts/fix-markdown-artefacts-batch2.ts --apply
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

interface Span {
  _type: string;
  text?: string;
  [key: string]: unknown;
}
interface PortableBlock {
  _type: string;
  children?: Span[];
  [key: string]: unknown;
}

function block(text: string, style: string, key: string): unknown {
  return {
    _type: "block",
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: "span", _key: `${key}s`, text, marks: [] }],
  };
}

async function main() {
  const changes: { id: string; title: string; note: string }[] = [];
  const transaction = client.transaction();
  let queued = 0;

  // 1. Yara pendant — "* 12" is a multiplication sign, not a bullet.
  {
    const id = "premier-housewares-5511726";
    const doc = await client.fetch<{ description: PortableBlock[] } | null>(
      `*[_id == $id][0]{description}`,
      { id },
    );
    if (doc?.description) {
      const next = doc.description.map((b: PortableBlock) => {
        const text = (b.children ?? []).map((c) => c.text ?? "").join("");
        if (text !== "Bulb Required: E14 40W * 12") return b;
        return {
          ...b,
          children: [
            { ...b.children![0]!, text: "Bulb Required: E14 40W × 12" },
          ],
        };
      });
      changes.push({
        id,
        title: "Yara Matt Black 12 Bulb Statement Pendant Light",
        note: '"* 12" -> "× 12"',
      });
      if (apply) {
        transaction.patch(id, (p) => p.set({ description: next }));
        queued++;
      }
    }
  }

  // 2. 5ft King Bed Frame — three "- **Label**: text" lines, strip the markdown.
  {
    const id = "product-aosom-83d-185v03cg";
    const replacements: Record<string, string> = {
      "- **Hydraulic storage**: Smooth lifting mechanism for easy access to hidden storage.":
        "Hydraulic storage: a smooth lifting mechanism for easy access to hidden storage.",
      "- **Dynamic RGB LED lighting**: Customisable ambient lighting options in seven colours with various modes controlled via remote.":
        "Dynamic RGB LED lighting: customisable ambient lighting in seven colours, with various modes controlled by remote.",
      "- **Built-in charging station**: 2 USB-A ports and 1 USB-C port for convenient device charging right by your bedside.":
        "Built-in charging station: 2 USB-A ports and 1 USB-C port for device charging right by the bedside.",
    };
    const doc = await client.fetch<{ description: PortableBlock[] } | null>(
      `*[_id == $id][0]{description}`,
      { id },
    );
    if (doc?.description) {
      const next = doc.description.map((b: PortableBlock) => {
        const text = (b.children ?? []).map((c) => c.text ?? "").join("");
        const replacement = replacements[text];
        if (!replacement) return b;
        return {
          ...b,
          children: [{ ...b.children![0]!, text: replacement }],
        };
      });
      changes.push({
        id,
        title:
          "5ft King Bed Frame with Hydraulic Storage and LED Lighting, Grey",
        note: "stripped ** markdown from 3 feature lines",
      });
      if (apply) {
        transaction.patch(id, (p) => p.set({ description: next }));
        queued++;
      }
    }
  }

  // 3. FAQ answers with literal " * Label: value" bullet markers.
  const faqFixes: {
    id: string;
    title: string;
    question: string;
    from: string;
    to: string;
  }[] = [
    {
      id: "product-aw-acshop-14",
      title: "Round Reclaimed Teak Bedside Table with Drawer",
      question: "What are the dimensions? ",
      from: "The bedside table measures:  * Length: 45 cm * Width: 37 cm * Height: 57 cm Its compact size makes it ideal for bedrooms, guest rooms and apartments.  ",
      to: "The bedside table measures 45cm long, 37cm wide and 57cm tall. Its compact size makes it ideal for bedrooms, guest rooms and apartments.",
    },
    {
      id: "product-aw-acshop-17",
      title: "Tall Reclaimed Teak Chest of 5 Drawers",
      question: "What are the dimensions? ",
      from: "The chest measures:  * Length: 48 cm * Width: 40 cm * Height: 110 cm Its tall, space-saving design makes it ideal for rooms where floor space is limited.  ",
      to: "The chest measures 48cm long, 40cm wide and 110cm tall. Its tall, space-saving design makes it ideal for rooms where floor space is limited.",
    },
    {
      id: "product-aw-bts-02",
      title: "Natural Wooden Beer Barrel Storage Stool",
      question: "What are the dimensions? ",
      from: "The stool measures:  * Height: 38 cm * Diameter: 32 cm Its compact size makes it ideal for smaller living spaces while still offering practical seating and storage.",
      to: "The stool measures 38cm tall with a 32cm diameter. Its compact size makes it ideal for smaller living spaces while still offering practical seating and storage.",
    },
    {
      id: "product-aw-rds-146",
      title: "Large Brown Wooden Storage Tub",
      question: "What are the dimensions? ",
      from: "The storage tub measures:  * Length: 45 cm * Width: 45 cm * Height: 32 cm",
      to: "The storage tub measures 45cm long, 45cm wide and 32cm tall.",
    },
    {
      id: "product-aw-rds-151",
      title: "Brown Wooden Storage Crates (Set of 3)",
      question: "What sizes are included? ",
      from: "The set includes three different-sized crates:  * Large: 45 × 30 × 25 cm * Medium: 35 × 25 × 24 cm * Small: 25 × 20 × 20 cm",
      to: "The set includes three different-sized crates: large at 45 × 30 × 25cm, medium at 35 × 25 × 24cm, and small at 25 × 20 × 20cm.",
    },
  ];

  for (const fix of faqFixes) {
    const doc = await client.fetch<{
      faqs: { question?: string; answer?: string }[];
    } | null>(`*[_id == $id][0]{faqs}`, { id: fix.id });
    if (!doc?.faqs) continue;
    const next = doc.faqs.map((f) =>
      f.answer === fix.from ? { ...f, answer: fix.to } : f,
    );
    changes.push({
      id: fix.id,
      title: fix.title,
      note: "FAQ dimensions answer de-markdowned",
    });
    if (apply) {
      transaction.patch(fix.id, (p) => p.set({ faqs: next }));
      queued++;
    }
  }

  // 4. Soft Squiggly Mirror — full rewrite, real facts only.
  {
    const id = "product-aw-ssm-05";
    const key = "soft-squiggly-mirror";
    const next = [
      block("A 30.5 × 22.5cm frame, 2.3cm deep", "h2", `${key}-0`),
      block(
        "The Soft Squiggly Mirror measures 30.5 × 22.5cm with a 2.3cm-deep chunky frame, and weighs 0.58kg — light enough to hang from a standard picture hook. The frame follows a wavy, hand-shaped outline rather than a straight rectangle, in a royal blue finish.",
        "normal",
        `${key}-1`,
      ),
      block(
        "Each one is handcrafted, so the exact curve of the frame varies slightly from mirror to mirror rather than being machine-identical.",
        "normal",
        `${key}-2`,
      ),
    ];
    changes.push({
      id,
      title: "Soft Squiggly Mirror",
      note: "full rewrite — corrupted generator output replaced with real-facts description",
    });
    if (apply) {
      transaction.patch(id, (p) => p.set({ description: next }));
      queued++;
    }
  }

  console.log(`${changes.length} products with fixes:\n`);
  for (const c of changes) console.log(`- ${c.id} | ${c.title} — ${c.note}`);

  if (apply && queued > 0) {
    await transaction.commit();
    console.log(`\nApplied: ${queued} products updated.`);
  } else if (!apply) {
    console.log("\nDry run — pass --apply to write these to Sanity.");
  }

  mkdirSync("docs/change-log", { recursive: true });
  writeFileSync(
    `docs/change-log/${new Date().toISOString().slice(0, 10)}-markdown-artefact-fix-batch2.json`,
    JSON.stringify({ apply, queued, changes }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
