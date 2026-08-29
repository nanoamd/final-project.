import type { Metadata } from "next";

import { VaseSizeCalculator } from "@/components/shared/vase-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Vase Size Calculator — What Flowers Fit Your Vase?",
  description:
    "The stem length to buy for a vase you own, or the vase height for flowers you already have, plus how many stems it takes to look full.",
  path: "/tools/vase-size-calculator",
});

export default async function VaseSizeCalculatorPage() {
  const products = await getProductsByCategory("vases", { limit: 8 });

  return (
    <ToolPage
      path="/tools/vase-size-calculator"
      heading="What size vase do you need?"
      intro="Enter the height of a vase you own for the stems to buy, or the length of stems you have for the vase that suits them. Either way it tells you how many you need."
      method={{
        heading: "The arithmetic, and the number nobody quotes",
        paragraphs: [
          "The ratio florists work to is that a vase should stand about half to two-thirds the height of the finished arrangement. A 30cm vase therefore carries flowers standing 45–60cm above the surface. Shorter than half and the arrangement is top-heavy, both to look at and in practice — a wide bunch in a short vase genuinely tips. Taller than two-thirds and the flowers vanish into the vessel.",
          "Stems are bought longer than the arrangement stands, because a length of every stem sits below the waterline and more is lost to cutting. The multiplier used here is 1.7 to 2.2 times the vase height, so that same 30cm vase wants stems at 50–70cm as bought.",
          "The second number matters more and almost nobody quotes it: the neck. A narrow neck holds the stems upright for you and looks full with three to seven. A wide mouth lets them fall outwards, so they have to support each other, and it takes fifteen to twenty before it stops reading as sparse. That is two or three supermarket bunches rather than one, and it is the real reason a bunch that looked good in the shop collapses on the table at home.",
          "If you buy flowers at a supermarket rather than a florist, narrow necks will serve you better and cost you less. If you are buying a vase for a dining table, stay under 30cm, because people have to see over it.",
        ],
      }}
      faqs={[
        {
          question: "How tall should a vase be for the flowers?",
          answer:
            "About half to two-thirds the height of the finished arrangement. A 30cm vase suits flowers standing 45–60cm above the table, which is stems bought at roughly 50–70cm once you allow for the length below the waterline.",
        },
        {
          question: "How many stems do I need to fill a vase?",
          answer:
            "It depends on the neck rather than the height. A narrow-necked vase looks full with three to seven stems, a medium one with seven to twelve, and a wide-mouthed one needs fifteen to twenty because nothing holds the stems upright but each other.",
        },
        {
          question: "What size vase is right for a dining table?",
          answer:
            "Under 30cm, so people can see across it. On a long table, two or three low vessels spaced down the length work better than a single tall arrangement in the centre.",
        },
        {
          question: "Why do my flowers flop outwards?",
          answer:
            "Almost always because the mouth of the vase is too wide for the number of stems in it. Either add stems until they support each other, or move the bunch to something with a narrower neck — a jam jar inside the vase will do it invisibly.",
        },
        {
          question: "What goes in a vase taller than 45cm?",
          answer:
            "Branches rather than cut flowers. Pussy willow, eucalyptus and blossom hold their shape for weeks or months, where flowers at that stem length are expensive and short-lived. A tall vase also needs enough weight in the base not to go over.",
        },
      ]}
      products={products}
      productsHeading="Vases, with their heights"
      guides={[
        {
          slug: "choosing-a-vase-for-what-you-put-in-it",
          title: "What size vase do you need for your flowers?",
        },
      ]}
    >
      <VaseSizeCalculator />
    </ToolPage>
  );
}
