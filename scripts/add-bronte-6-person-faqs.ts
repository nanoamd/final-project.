/**
 * Adds the FAQ set the Bronte 6-Person Outdoor Cabin Sauna never had.
 *
 * At £5,279 it is the second most expensive product in the catalogue and the
 * only sauna with no FAQs at all — its 2-person sibling has ten, the Pennine
 * Barrel has ten, the Yorkshire Cabin 4-Person has fifteen. Nobody spends five
 * thousand pounds on a garden building without first wanting to know what base
 * it needs, who wires it up and what happens if it arrives damaged, and the
 * FAQs are also what feeds FaqJsonLd into the page's structured data.
 *
 * Every answer is drawn from this product's own stored fields and description —
 * the 6kW Harvia heater, thermo-treated spruce, 1800 × 1600 × 2000 mm, 4–6
 * weeks, 90–100°C — or from the wording already agreed across the sauna range
 * for the model-independent questions: installation, base, electrician,
 * warranty, returns.
 *
 * Three deliberate departures from the 2-person's set:
 *
 *   - The delivery answer does not repeat "new stock is arriving in August".
 *     Both Bronte models are Out of Stock and both carry that line, which was
 *     true when written and cannot stay true — it is a promise with a date in it
 *     on a page nobody re-reads. This one states the stock position and the 4–6
 *     week lead time, which holds whenever it is read.
 *   - The electrical answer says a 6kW heater needs its own appropriately rated
 *     circuit rather than naming an amperage or a phase. The rating depends on
 *     the property and the manufacturer's figures, and a wrong number here is
 *     one an electrician acts on.
 *   - A capacity answer that gives the cabin's footprint, because "seats six" on
 *     a 1.8 × 1.6 m cabin is the fact a buyer most needs to check against the
 *     space they have.
 *
 * Refuses to run if the product already has FAQs. Dry run by default; --apply.
 *   pnpm tsx --env-file=.env.local scripts/add-bronte-6-person-faqs.ts
 */
import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");

const SLUG = "saunaplunge-bronte-6-person-outdoor-cabin-sauna";

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

const FAQS: [question: string, answer: string][] = [
  [
    "How is the Bronte different from an infrared sauna?",
    "The Bronte is a traditional Finnish-style sauna: a 6kW Harvia electric heater warms the air inside the cabin to around 90–100°C, and water can be poured over the heated stones to create steam. An infrared sauna instead warms the body directly and runs much cooler, typically 45–60°C. If you want the high-heat, steam-and-stones experience, the Bronte is the traditional one.",
  ],
  [
    "How many people does it seat, and how much space does it need?",
    "The cabin seats up to six adults. It measures 1800 mm wide, 1600 mm deep and 2000 mm high, so allow for that footprint plus clear access around it for assembly and for airflow behind the cabin. Check the height against fences, overhanging branches and any planning or boundary restrictions before you order.",
  ],
  [
    "Is it suitable for year-round outdoor use?",
    "Yes. The Bronte is built from premium thermo-treated spruce, which is treated specifically to resist moisture, movement and changing weather, so it is designed to stay outdoors all year when installed and maintained in line with the manufacturer's recommendations.",
  ],
  [
    "What electrical supply does the 6kW heater need?",
    "The heater must be installed by a qualified electrician on its own appropriately rated dedicated circuit — a 6kW heater draws far more than a standard domestic socket will carry, and it cannot be plugged in. Your electrician will size the supply from the manufacturer's installation figures and current UK wiring regulations. It is worth getting that quote before you order, since the supply is usually the largest additional cost.",
  ],
  [
    "Can I install it myself?",
    "The sauna arrives as a modular kit with full assembly instructions, so a competent DIYer can build the cabin. Professional installation is recommended, and the electrical connection must always be completed by a qualified electrician.",
  ],
  [
    "What base does it need?",
    "A solid, level base — concrete, paving or reinforced decking. The base matters more than most people expect: a cabin this size will not seal or sit square on ground that moves or slopes, so get the base right before the sauna arrives.",
  ],
  [
    "Is the heater included?",
    "Yes. The Bronte is supplied with a 6kW Harvia electric heater, from one of the most established sauna heater manufacturers in the world, along with its stones.",
  ],
  [
    "It says out of stock — when can I get one?",
    "This model is currently out of stock. Once new stock arrives and your order is confirmed, delivery typically takes 4–6 weeks and our delivery partner will call you to arrange a date. Email us if you would like to be told as soon as it is back, or if you have a date you are working towards — we would rather tell you honestly whether we can meet it.",
  ],
  [
    "How long does a session take, and what does it cost to run?",
    "Allow around 30–45 minutes for the cabin to come up to temperature from cold, then sessions are typically 10–20 minutes at a time. Running cost depends on your electricity tariff and how long you heat it for; as a guide, a 6kW heater uses up to 6kWh in an hour of full-power heating, and less once it is up to temperature and cycling.",
  ],
  [
    "Does it come with a warranty?",
    "Yes. The Bronte is backed by a 1-Year Manufacturer's Warranty, covering manufacturing defects relating to structural integrity, electrical components, materials and workmanship under normal residential use.",
  ],
  [
    "Can I return it if I change my mind?",
    "Because of its size and specialist nature, a return has to be authorised before collection can be arranged — please contact us rather than sending it back. If it arrives damaged or develops a manufacturing fault, tell us as soon as you can and we will sort it out. Your statutory rights under UK consumer law are unaffected either way.",
  ],
];

async function main() {
  // Published and draft copies both, so publishing a draft cannot reinstate an
  // empty FAQ list on a £5,279 page.
  const docs = await client.fetch<
    { _id: string; title: string; price: number; faqs: number }[]
  >(
    `*[_type == "product" && slug.current == $slug]{_id, title, price, "faqs": count(faqs)}`,
    { slug: SLUG },
  );

  if (!docs.length) {
    console.error(`No product with slug "${SLUG}" — aborting.`);
    process.exit(1);
  }

  let written = 0;
  for (const doc of docs) {
    const draft = doc._id.startsWith("drafts.");
    if (doc.faqs) {
      console.log(
        `· ${doc.title.slice(0, 52)}${draft ? " [draft]" : ""} already has ${doc.faqs} FAQ(s) — left alone`,
      );
      continue;
    }
    if (apply) {
      await client
        .patch(doc._id)
        .set({
          // `faqEntry`, not `faq` — the latter is the standalone document type
          // behind the /faq page, and a product's inline FAQs are the object.
          faqs: FAQS.map(([question, answer]) => ({
            _type: "faqEntry",
            question,
            answer,
          })),
        })
        .commit();
    }
    console.log(
      `${apply ? "✓" : "·"} ${doc.title.slice(0, 52)}${draft ? " [draft]" : ""} — ${FAQS.length} FAQs`,
    );
    written++;
  }

  console.log(
    `\n${written} document(s) ${apply ? "updated" : "to update"}.` +
      (apply ? "\n" : "\nDry run — nothing written. Re-run with --apply.\n"),
  );
}

main().catch((err) => {
  console.error("add-bronte-6-person-faqs failed:", err);
  process.exit(1);
});
