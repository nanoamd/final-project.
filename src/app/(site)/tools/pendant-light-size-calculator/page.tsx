import type { Metadata } from "next";

import { PendantLightCalculator } from "@/components/shared/pendant-light-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "How High to Hang a Pendant Light — Size & Height Calculator",
  description:
    "What size pendant light for your room or dining table, and how low to hang it. Enter your measurements and get the diameter and drop height that work.",
  path: "/tools/pendant-light-size-calculator",
});

export default async function PendantLightSizeCalculatorPage() {
  const products = await getProductsByCategory("lighting", { limit: 8 });

  return (
    <ToolPage
      path="/tools/pendant-light-size-calculator"
      heading="What size pendant light, and how high to hang it?"
      intro="Two different questions wearing one name. Over a table the table decides; in open floor space the room decides. Tell us which, and we will give you a diameter and a drop height."
      method={{
        heading: "The rules this uses, and where they come from",
        paragraphs: [
          "For a room, the old designer's rule is to add the width and the length in feet and read the answer in inches. A 12ft by 14ft room wants a fixture around 26in across. In metric that comes out as the width plus the length in metres, times ten, in centimetres — so a 3.5m by 4.5m room wants roughly 80cm.",
          "Over a dining table the room is irrelevant. The table sets the size, and a pendant between a half and two-thirds of the table's width reads as belonging to it. A fixture sized to the room and hung over a table almost always looks too big.",
          "Height over a table is 75 to 90cm from the tabletop to the bottom of the shade. Lower and it blocks the eye line between people sitting opposite each other; higher and it stops lighting the table, which was the point.",
          "In open floor space the constraint is headroom, not proportion: leave at least 210cm clear beneath the shade. Under a tall ceiling, drop it further — roughly 7.5cm more for every foot of ceiling above the standard 8ft — otherwise the fixture reads as stranded near the ceiling.",
          "Under a ceiling below about 240cm, a flush or semi-flush fitting will serve better than a pendant however carefully it is sized. There is no drop height that makes a hanging fixture comfortable in a low room.",
        ],
      }}
      faqs={[
        {
          question: "How high should a pendant light hang over a dining table?",
          answer:
            "Between 75cm and 90cm from the tabletop to the bottom of the shade. That leaves the sight line across the table clear while still putting light where the food is. Measure from the tabletop, not from the floor or the ceiling.",
        },
        {
          question: "What size pendant light for a dining table?",
          answer:
            "Between a half and two-thirds of the table's width. For a 90cm table that means a fixture around 52cm across, and anything from 45cm to 59cm will look right. Sizing to the room instead of the table is the usual reason a pendant looks too big.",
        },
        {
          question: "What size ceiling light for a living room?",
          answer:
            "Add the room's width and length in metres and multiply by ten to get the diameter in centimetres. A 3.5m by 4.5m room wants roughly 80cm across. That is a starting point rather than a limit — a single statement fixture can be larger if nothing else in the room competes with it.",
        },
        {
          question: "How much headroom does a pendant light need?",
          answer:
            "At least 210cm of clear space beneath it anywhere people walk. Below that, taller people duck and everyone notices. Over furniture — a table, an island, a sofa — the headroom rule does not apply, because nobody walks underneath.",
        },
        {
          question: "Can I hang a pendant light in a room with low ceilings?",
          answer:
            "You can, but a flush or semi-flush fitting will almost always look and feel better under a ceiling below about 240cm. A pendant needs air above and below it to read as intentional, and a low room cannot give it either.",
        },
      ]}
      products={products}
      productsHeading="Lighting in stock"
      guides={[
        {
          slug: "table-lamp-size-guide",
          title: "What size table lamp for a bedside or console?",
        },
      ]}
    >
      <PendantLightCalculator />
    </ToolPage>
  );
}
