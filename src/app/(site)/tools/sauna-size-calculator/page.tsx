import type { Metadata } from "next";

import { CapacityMatchCalculator } from "@/components/shared/capacity-match-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByDepartment } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Sauna Do I Need? Capacity Calculator",
  description:
    "Work out what size sauna you need for the number of people who will actually use it, matched against real in-stock saunas and their own capacity specs.",
  path: "/tools/sauna-size-calculator",
});

export default async function SaunaSizeCalculatorPage() {
  const products = await getProductsByDepartment("sauna");

  return (
    <ToolPage
      path="/tools/sauna-size-calculator"
      heading="What size sauna do I need?"
      intro="Tell us how many people will typically use it and we will match you against real in-stock saunas, using each one's own stated capacity rather than a rule of thumb."
      method={{
        heading: "How the answer is worked out",
        paragraphs: [
          "Every sauna we sell records its own capacity as a specification — two person, four person, six person — and the calculator reads that field directly. It does not estimate from floor area or bench length, so the match you get always traces back to something the manufacturer stated about that particular cabin.",
          "The number worth planning around is not how many people can physically sit down, it is how many will use it at once on an ordinary evening. A four-person cabin seats four upright, but two people who want to lie down need those same four places. If lying down matters to you, choose for that rather than for the headcount.",
          "Capacity and footprint are different questions. A barrel sauna of a given capacity takes up a longer, narrower plot than a cabin of the same capacity, so once you know the size you need, check the depth and width against where it is actually going before ordering.",
        ],
      }}
      faqs={[
        {
          question: "What size sauna is best for two people?",
          answer:
            "A two-person cabin is enough if both of you sit upright, and it is the cheapest to heat and the quickest to get up to temperature. Choose a four-person model instead if either of you wants to lie down, or if you expect to use it with guests more than occasionally — the running cost difference is smaller than the disappointment of a cabin you cannot stretch out in.",
        },
        {
          question: "Does a bigger sauna cost much more to run?",
          answer:
            "It costs more to bring up to temperature because there is more air and more timber to heat, and it takes longer to get there. Once at temperature the difference is smaller, because a well-built cabin loses heat through its surface rather than its volume. The practical effect is on how long you wait before a session, not on your electricity bill over a year.",
        },
        {
          question: "How much space do I need around an outdoor sauna?",
          answer:
            "Leave clearance on every side rather than pushing it against a fence or wall. Air needs to circulate around the shell, the side pressed against a boundary stays damp long after the rest has dried, and you need to be able to reach all of it to maintain it. Check the depth and width in the specifications against your actual plot before ordering.",
        },
        {
          question: "Do I need a base or foundation for an outdoor sauna?",
          answer:
            "It needs to stand on something firm and level — paving slabs, a concrete pad or a properly built deck. Level matters more than material: a cabin sitting on ground that settles unevenly will twist, and the door will stop closing cleanly. Check the individual product page for what that model states about its base requirements.",
        },
      ]}
      products={products}
      productsHeading="Saunas currently in stock"
      guides={[
        {
          slug: "choosing-a-sauna",
          title: "Barrel vs cabin sauna: how to choose",
        },
      ]}
    >
      <CapacityMatchCalculator products={products} noun="sauna" />
    </ToolPage>
  );
}
