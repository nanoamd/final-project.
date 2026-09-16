import type { Metadata } from "next";

import { PendantLightCalculator } from "@/components/shared/pendant-light-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getArticleSidebar, getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "How High to Hang a Pendant Light — Size & Height Calculator",
  description:
    "What size pendant light for your room or dining table, and how low to hang it. Enter your measurements and get the diameter and drop height that work.",
  path: "/tools/pendant-light-size-calculator",
});

export default async function PendantLightSizeCalculatorPage() {
  const products = await getToolProducts("lighting", { limit: 8 });
  const sidebar = await getArticleSidebar({
    slug: "pendant-light-size-calculator",
    categorySlug: "lighting",
    productSlugs: products.map((p) => p.slug),
  });

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
      sections={[
        {
          heading: "How to measure for a pendant light",
          paragraphs: [
            "Four numbers, and which ones you need depends on where the light is going.",
            "Over a table, measure the table's width at its narrowest — the short dimension on a rectangle, the diameter on a round one. This is what sizes the fixture. Then measure the tabletop to the ceiling, because that is the run the drop has to fit inside, not the floor to the ceiling.",
            "In open floor space, measure the room's width and length in metres and the floor to the ceiling. The first two size the fixture; the third decides whether a pendant is the right fitting at all.",
            "Over a kitchen island, measure the island's length rather than its width, because you are usually sizing a run of two or three small pendants rather than one large one. Two pendants over a 180cm island want to be around 30 to 35cm across each, spaced so that each sits over a third of the length — which puts them roughly 60cm apart, centre to centre, with 60cm to each end. Three smaller ones over the same island look busy unless the island is over 2m.",
            "One thing worth checking before anything else: where the existing ceiling rose actually is. It is rarely centred over where the table ended up, and a pendant hung from the rose rather than over the table is the most common lighting mistake in a British dining room. A ceiling hook and a swag of flex will move it; so will an electrician, properly, for more.",
          ],
        },
        {
          heading: "Kitchen islands, bedsides, and stairwells",
          paragraphs: [
            "Three positions where the table and room rules do not apply, and each has its own answer.",
            "Over a kitchen island, hang the bottom of the shade 75 to 85cm above the worktop — slightly higher than over a dining table, because you stand at an island rather than sit, and a pendant at dining height is at eye height when you are standing. Keep the shades narrow enough that the run does not overhang the worktop edge, because a shade you catch with an elbow while chopping will not survive the year.",
            "Beside a bed, a pair of pendants replacing bedside lamps wants the bottom of the shade at about 50 to 65cm above the mattress — reachable from lying down, clear of your head sitting up. They free the whole bedside table, which is the point, and they need the wiring decided before the plastering, which is the catch.",
            "In a stairwell, the fixture is sized by the void rather than by any floor. The bottom of the shade should clear the highest step by at least 210cm measured vertically from that step's nose, which is usually a much longer drop than it looks from the landing. Measure it from the stairs themselves rather than estimating from the top — and think about how the bulb gets changed before you commit to a drop that needs a tower scaffold.",
          ],
        },
        {
          heading: "Two pendants, three, or one",
          paragraphs: [
            "The count is a proportion question, and it is decided by the length of what the light is over rather than by taste.",
            "One pendant suits a round or square table and any table under about 120cm. Centre it on the table, not on the room, and accept that this may mean the fixture is visibly off-centre in the room itself — the table is what the eye pairs it with.",
            "Two suit a rectangular table of 150 to 220cm, or an island of similar length. Divide the length into halves and centre one pendant on each half, which puts them a quarter of the length in from each end.",
            "Three suit anything over about 220cm, and each one wants to be noticeably smaller than a single fixture would have been — roughly a third of the table width rather than a half. Three large pendants over a long table is the arrangement that most often reads as overdone.",
            "Whatever the count, hang them all at the same height. A staggered run looks deliberate in a photograph of a double-height hall and looks like a mistake over a dining table.",
          ],
        },
        {
          heading: "Getting the light right, not just the size",
          paragraphs: [
            "A correctly sized pendant that is the wrong brightness or the wrong colour is still the wrong light, and neither is on the size label.",
            "For a dining table, 400 to 800 lumens from the pendant is usually enough, because it is doing atmosphere rather than task lighting. Over a kitchen island it is the reverse — you are chopping under it, so 700 to 1,000 lumens per pendant, and think about whether the shade throws light down or sideways.",
            "Colour temperature matters more than most people expect. 2,700K is the warm domestic light that suits a dining room and a living room. 3,000K to 4,000K suits a kitchen worktop where you want to see what you are doing. Mixing the two in one open-plan room is what makes a kitchen-diner feel like two rooms that have been stapled together.",
            "An open-bottomed shade puts a bright bulb in the eye line of anyone sitting opposite. Either choose a diffused or enclosed shade over a dining table, or choose a bulb you can look at — and put the whole circuit on a dimmer, which is the single cheapest thing that makes a dining room work in the evening.",
          ],
        },
      ]}
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
        {
          question:
            "How high should pendant lights hang over a kitchen island?",
          answer:
            "75 to 85cm from the worktop to the bottom of the shade — slightly higher than over a dining table, because you stand at an island rather than sit, and a pendant at dining height is at eye height standing up. Keep the shades inside the worktop edge so you do not catch one with an elbow.",
        },
        {
          question: "How many pendant lights over an island or table?",
          answer:
            "One under about 120cm, two from 150 to 220cm, three above that. Divide the length into equal parts and centre a pendant on each, so two sit a quarter of the length in from each end. Three should each be smaller than a single fixture would have been, or the run reads as overdone.",
        },
        {
          question: "How far apart should two pendant lights be?",
          answer:
            "Divide the table or island length into halves and centre one on each half. Over a 180cm island that puts them roughly 60cm apart centre to centre, with about 60cm to each end. Hang both at exactly the same height — a staggered run over a table reads as a mistake.",
        },
        {
          question: "What if the ceiling rose is not over the table?",
          answer:
            "It usually is not, and hanging the pendant from wherever the rose happens to be is the most common lighting mistake in a British dining room. A ceiling hook and a swag of flex will pull the light across for very little; moving the rose itself is an electrician's job. Decide this before you buy the fixture, because a swag needs extra flex length.",
        },
        {
          question: "What colour temperature should a pendant light be?",
          answer:
            "2,700K over a dining table or in a living room — the warm light that suits an evening. 3,000K to 4,000K over a kitchen worktop, where you need to see what you are cutting. Mixing the two in one open-plan room is what makes a kitchen-diner feel like two rooms stapled together.",
        },
      ]}
      products={products}
      sidebar={sidebar}
      sidebarCategorySlug="lighting"
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
