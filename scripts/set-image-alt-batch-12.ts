/**
 * Batch 12 of the image alt-text pass — the four Outsunny products.
 *
 * These four were published after batch 11 ran, so all 17 of their gallery
 * images went live with no alt text. scripts/audit-products.ts is what found
 * them; batch 11's lesson was that a growing catalogue needs a check that runs
 * again rather than a sweep that finishes.
 *
 * Every image was downloaded and viewed at 700px before its description was
 * written. Several are the supplier's annotated feature panels rather than
 * plain product shots — those say what the panel shows, because a screen reader
 * reaching "Storage space: keep charcoal, plates or tools at hand" and hearing
 * nothing has lost the same information a sighted visitor just gained.
 *
 * Same mechanics as batch 11: keyed by gallery index, patches published and
 * draft copies of the slug, and never overwrites existing alt text.
 *
 * Dry run by default; --apply to write.
 *   pnpm tsx --env-file=.env.local scripts/set-image-alt-batch-12.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

/** slug → { gallery index: alt text } */
const ALT_TEXT: Record<string, Record<number, string>> = {
  "portable-charcoal-bbq-grill-with-wheels": {
    0: "Black kettle charcoal BBQ with a domed lid, wooden handles, stainless steel legs, two wheels and a lower storage shelf",
    1: "Close-up of the charcoal BBQ's lower wire shelf holding a stack of plates, on a decked patio",
    2: "Feature panel on temperature control: the domed lid holds heat for smoking, and the adjustable top vent sets the internal temperature",
    3: "Feature panel labelling the BBQ's anti-scald wooden handles, enamelled steel body and stainless steel legs",
    4: "Dimensions diagram for the charcoal BBQ: 94 cm high, 48 cm wide, 56 cm deep, with a 46.5 cm bowl, a 44 cm cooking grate and a 33 cm charcoal grate",
  },
  "solar-garden-lamp-post-dimmable-led-black": {
    0: "Black solar lamp post with a traditional four-sided lantern head, shown full length beside a close-up of the lit lantern",
    1: "Dimensions diagram for the solar lamp post: 160 cm tall with an 18 cm square lantern head, its solar panel set into the roof",
    2: "Feature panel showing the two fixing methods: expansion screws through the base plate on paving, or the pointed ground stake in a lawn",
    3: "The solar lamp post lit at dusk on a garden path, its 160 cm height marked against the planting beside it",
  },
  "solar-garden-water-feature-led-pump": {
    0: "Four-tier cascading water feature of stacked stone-effect rock and bronze pots, lit from within and running on a patio beside a rattan chair",
    1: "Studio view of the water feature's four bronze pots tipped through a grey stone-effect rock column",
    2: "The water feature running on a decked patio beside a fern, with its separate solar panel standing on the deck",
    3: "Dimensions diagram for the water feature: 72 cm high, 37 cm wide and 36 cm deep, with pour heights of 43 cm and 21 cm",
  },
  "solar-outdoor-garden-floor-lantern-led-light": {
    0: "Tall dark rattan-effect floor lantern with a slatted weave, a solar panel in its lid and a lit diffuser glowing through the weave",
    1: "Three of the woven solar floor lanterns lighting a stepping-stone path at night, among ferns and low planting",
    2: "Feature panel showing the lantern's dusk-to-dawn light sensor and its on/off switch, with the lantern lit on a lawn and beside a patio",
    3: "Dimensions diagram for the solar floor lantern: 68 cm high on a 20 cm square base",
  },
};

async function main() {
  let set = 0;
  let kept = 0;
  let missing = 0;

  for (const [slug, alts] of Object.entries(ALT_TEXT)) {
    const docs = await client.fetch<
      {
        _id: string;
        title: string;
        gallery: { alt?: string; hasAsset: boolean }[] | null;
      }[]
    >(
      `*[_type == "product" && slug.current == $slug]{
        _id, title,
        "gallery": gallery[]{alt, "hasAsset": defined(asset)}
      }`,
      { slug },
    );

    if (!docs.length) {
      console.warn(`✗ ${slug}: no product with this slug`);
      continue;
    }

    for (const doc of docs) {
      const draft = doc._id.startsWith("drafts.");
      const gallery = doc.gallery ?? [];
      const patch: Record<string, string> = {};

      for (const [indexKey, alt] of Object.entries(alts)) {
        const index = Number(indexKey);
        const image = gallery[index];
        if (!image) {
          console.warn(
            `  ⚠ ${slug}${draft ? " (draft)" : ""}: no image at index ${index} — skipped`,
          );
          missing++;
          continue;
        }
        if ((image.alt ?? "").trim()) {
          kept++;
          continue;
        }
        patch[`gallery[${index}].alt`] = alt;
      }

      const count = Object.keys(patch).length;
      if (!count) continue;
      if (apply) await client.patch(doc._id).set(patch).commit();
      console.log(
        `${apply ? "✓" : "·"} ${doc.title.slice(0, 52).padEnd(54)}${draft ? "[draft] " : "        "}${count} image(s)`,
      );
      set += count;
    }
  }

  console.log(
    `\n${set} alt text${set === 1 ? "" : "s"} ${apply ? "written" : "to write"}` +
      `${kept ? `, ${kept} left as they were` : ""}` +
      `${missing ? `, ${missing} slot(s) missing an image` : ""}.`,
  );
  if (!apply) console.log("Dry run — nothing written. Re-run with --apply.\n");
  else console.log("");
}

main().catch((err) => {
  console.error("set-image-alt-batch-12 failed:", err);
  process.exit(1);
});
