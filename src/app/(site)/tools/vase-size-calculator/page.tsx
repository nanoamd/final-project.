import type { Metadata } from "next";

import { VaseSizeCalculator } from "@/components/shared/vase-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getArticleSidebar, getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Vase Size Calculator — What Flowers Fit Your Vase?",
  description:
    "The stem length to buy for a vase you own, or the vase height for flowers you already have, plus how many stems it takes to look full.",
  path: "/tools/vase-size-calculator",
});

export default async function VaseSizeCalculatorPage() {
  const products = await getToolProducts("vases", { limit: 8 });
  const sidebar = await getArticleSidebar({
    slug: "vase-size-calculator",
    categorySlug: "vases",
    productSlugs: products.map((p) => p.slug),
  });

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
      sections={[
        {
          heading: "How to measure a vase, and a bunch of flowers",
          paragraphs: [
            "Vase height is the base to the rim, on the outside. Ignore any decorative lip or handle above the rim — the rim is where the stems rest and where the arrangement starts.",
            "Neck width is the inside diameter at the narrowest point of the opening, which on a lot of shapes is not the rim itself. A bottle-neck vase might be 12cm at the mouth and 5cm at the throat; it is the 5cm that decides how many stems go in and how they sit. Measure with a ruler laid across the opening, then subtract the glass thickness, or just push a hand in and feel where it stops.",
            "Interior depth is the rim down to the inside of the base, which is usually a centimetre or two less than the outside height and occasionally much less on a heavy weighted base. This is what tells you how much stem is submerged and therefore how much you are cutting off.",
            "For the flowers, measure a stem from the cut end to the top of the bloom. Supermarket bunches are typically sold at 40 to 50cm, florist stems at 50 to 70cm, and specialist or branch material well over that. It is worth checking rather than assuming: the same variety is sold at both lengths and the price difference is mostly the length.",
          ],
        },
        {
          heading: "Vase shapes, and what each one is actually for",
          paragraphs: [
            "Shape does more work than height, and each of the common ones exists to solve a particular problem.",
            "A cylinder is the neutral choice and the most forgiving: the neck is the same as the body, so stems stand where you put them and the count is predictable. It suits a hand-tied bunch straight from the shop with nothing done to it.",
            "A bottle or bud vase has a throat that grips a small number of stems and holds them upright. Three stems in a bud vase read as deliberate where three stems in a cylinder read as leftovers. A row of three or five bud vases down a table is the cheapest arrangement that looks considered.",
            "A fishbowl or bowl shape needs volume — fifteen to twenty stems, cut short, packed until they support each other. It is the shape most often bought for a single supermarket bunch and most often disappointing, because one bunch in a fishbowl collapses outwards and shows the water.",
            "An urn or trumpet flares out at the top, which is what you want for a loose, wide arrangement with foliage in it — the flare gives the stems somewhere to go. It needs weight in the base, because a wide arrangement in a flared vessel is genuinely tippy.",
            "A ginger jar or a vessel with a shoulder narrower than its belly is the hardest to fill and the easiest to arrange in, because the shoulder does the holding for you. If you only ever buy one vase, this shape and a cylinder are the two worth owning.",
          ],
        },
        {
          heading: "Where the vase is going",
          paragraphs: [
            "The right vase for a hall table is the wrong one for a dining table, and the constraint is different in each place.",
            "On a dining table, stay under 30cm so people can see across it. On a table longer than about 180cm, three low vessels spaced down the length work better than one tall arrangement in the middle — and they can be moved apart when the table is full. Scent matters here too: lilies and hyacinths at close range compete with the food.",
            "On a hall console or a sideboard, height is the point. This is where a 40cm-plus vase earns its place, and it is where branches rather than cut flowers make sense — eucalyptus, pussy willow or blossom hold their shape for weeks and cost less per week than a fortnightly bunch.",
            "On a mantel, work in odd numbers and vary the heights, and keep the arrangement narrow: anything that projects forward gets caught by a sleeve. Check the heat, too — above a working fire, cut flowers are done in days.",
            "Beside a bed or in a bathroom, small is better than tall. A bud vase with three stems is the right scale, and it does not fall over when someone reaches past it in the dark.",
          ],
        },
        {
          heading: "Making flowers last, once the vase is right",
          paragraphs: [
            "The size is the part that makes an arrangement look right. These are the parts that make it still look right on day six.",
            "Cut every stem on a slant before it goes in, and cut it under running water if you can. A flat cut sits on the bottom of the vase and seals itself against the glass; an angled cut cannot.",
            "Strip every leaf that would sit below the waterline. Leaves in water rot within a day or two, and that is what turns the water cloudy and shortens the whole arrangement — this single step does more than any flower food.",
            "Change the water every two days rather than topping it up, and rinse the vase when you do. A narrow-necked vase is harder to clean, which is the one real argument against it; a bottle brush solves it.",
            "Keep the vase out of direct sun, away from a radiator, and away from the fruit bowl — ripening fruit gives off ethylene, which makes cut flowers age fast. And recut the stems by a centimetre every few days; they seal over, and a fresh cut restarts the water uptake.",
          ],
        },
      ]}
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
        {
          question: "How do I measure a vase for flowers?",
          answer:
            "Height is the base to the rim on the outside, ignoring any decorative lip. Neck width is the inside diameter at the narrowest point of the opening, which on a bottle shape is the throat rather than the rim — and it is the throat that decides how many stems fit and how they sit. Interior depth tells you how much stem ends up underwater.",
        },
        {
          question: "What shape of vase is easiest to arrange in?",
          answer:
            "Anything with a shoulder narrower than its belly — a ginger jar shape — because the shoulder holds the stems for you. A plain cylinder is the most forgiving and the most predictable. A fishbowl is the hardest, because it needs fifteen to twenty stems before it stops showing the water.",
        },
        {
          question: "How long should flower stems be for a vase?",
          answer:
            "Roughly 1.7 to 2.2 times the vase height as bought, because a length of every stem sits below the waterline and more is lost to cutting. A 30cm vase therefore wants stems of 50 to 70cm. Supermarket bunches are usually 40 to 50cm; florist stems 50 to 70cm.",
        },
        {
          question: "How often should I change the water in a vase?",
          answer:
            "Every two days, rather than topping it up, and rinse the vase when you do. Strip any leaf that would sit below the waterline before the flowers go in — rotting leaves are what turns the water cloudy, and removing them does more for how long an arrangement lasts than flower food does.",
        },
        {
          question: "What size vase for a hall table or console?",
          answer:
            "This is where height earns its place — 40cm and up. It is also where branches beat cut flowers: eucalyptus, pussy willow or blossom hold their shape for weeks or months and cost less per week than a fortnightly bunch. Make sure the base has enough weight not to go over.",
        },
      ]}
      products={products}
      sidebar={sidebar}
      sidebarCategorySlug="vases"
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
