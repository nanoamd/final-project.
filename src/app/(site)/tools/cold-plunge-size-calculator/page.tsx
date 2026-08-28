import type { Metadata } from "next";

import { CapacityMatchCalculator } from "@/components/shared/capacity-match-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByDepartment } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Cold Plunge Do I Need? Capacity Calculator",
  description:
    "Work out what size cold plunge suits your height and how many people will use it, matched against real in-stock tubs and their own stated capacity.",
  path: "/tools/cold-plunge-size-calculator",
});

export default async function ColdPlungeSizeCalculatorPage() {
  const products = await getProductsByDepartment("cold-plunge");

  return (
    <ToolPage
      path="/tools/cold-plunge-size-calculator"
      heading="What size cold plunge do I need?"
      intro="Tell us how many people will use it and we will match you against real in-stock plunges, reading each one's own stated capacity and water volume rather than guessing."
      method={{
        heading: "How the answer is worked out",
        paragraphs: [
          "Each plunge records its capacity and its water volume as specifications, and the calculator reads both. Volume is the number that decides how long a chiller takes to pull the water down and how much ice you would otherwise be buying, so it is shown alongside the match rather than buried.",
          "Cold plunges are bought by fit rather than by headcount. Almost nobody plunges two at a time, so the useful question is whether you can submerge to the shoulders with your knees down — which depends on your height and on the tub's internal length, not on how many people it is sold as seating.",
          "If two people will use it in the same session, size for the taller of you and plan for consecutive dips rather than a shared one. Water temperature recovers between people far faster than a larger tub chills down.",
        ],
      }}
      faqs={[
        {
          question: "What size cold plunge do I need for my height?",
          answer:
            "Look at internal length rather than external dimensions. You want to submerge to the shoulders with your knees bent but not folded to your chest, which for most adults means an internal length of at least 120cm, and closer to 150cm if you are over six foot. The external footprint tells you whether it fits your patio; the internal length tells you whether it fits you.",
        },
        {
          question: "How much water does a cold plunge hold?",
          answer:
            "It varies by model and each product page states its own volume. It matters for two reasons: a chiller's pull-down time is proportional to volume, and if you are filling with ice instead, the volume decides how much you are buying each time. A smaller tub is quicker and cheaper to run, which is worth weighing against comfort.",
        },
        {
          question: "Do I need a chiller, or will ice do?",
          answer:
            "Ice works and costs nothing up front, but you buy it every session and the temperature drifts up as you sit in it. A chiller holds a set temperature, makes the tub usable daily without preparation, and is the difference between a habit and an occasional novelty. Which is right depends on how often you genuinely expect to use it.",
        },
        {
          question: "Can a cold plunge stay outside in winter?",
          answer:
            "British winters are mild enough that the water is unlikely to freeze solid, and cold weather does the chilling for you. What matters is that the tub itself is rated for outdoor use and that any chiller or pump is protected from frost. Check the individual product page rather than assuming, and if it is not stated, treat it as a question to ask before buying.",
        },
      ]}
      products={products}
      productsHeading="Cold plunges currently in stock"
      guides={[
        {
          slug: "choosing-a-sauna",
          title: "Barrel vs cabin sauna: how to choose",
        },
      ]}
    >
      <CapacityMatchCalculator
        products={products}
        noun="cold plunge"
        extraSpecLabel="Water volume"
        minPeople={1}
      />
    </ToolPage>
  );
}
