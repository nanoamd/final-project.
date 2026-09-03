import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Tools",
  description:
    "Fourteen free calculators for the questions that come before a purchase — mirror and pendant sizing, dining table fit, bed size, planter volume, patio heat output, sauna capacity.",
  path: "/tools",
});

/**
 * Grouped, because there are fourteen now and a flat list of fourteen reads
 * as a dump. The visible copy below had drifted to "ten" while this comment
 * already said twelve — fixed both to the real count while adding two more.
 *
 * Ordered within each group by how often the question gets asked rather than by
 * when the tool was built.
 */
const GROUPS = [
  {
    heading: "Sizing and fit",
    tools: [
      {
        href: "/tools/dining-set-size-calculator",
        title: "Will the garden dining set fit?",
        description:
          "Enter your patio and get the largest table that fits with room to get out of a chair — and what it will really seat.",
      },
      {
        href: "/tools/dining-table-size-calculator",
        title: "Will the dining table fit?",
        description:
          "The indoor version — enter your dining room and get the largest table that fits, and what it will really seat.",
      },
      {
        href: "/tools/bed-size-calculator",
        title: "What size bed fits my room?",
        description:
          "The largest UK bed size your room takes with room left to walk round it and make the bed, matched against real in-stock frames.",
      },
      {
        href: "/tools/mirror-size-calculator",
        title: "What size mirror above a console table?",
        description:
          "The mirror width that looks deliberate over a console, sideboard or mantel, and how high to hang it.",
      },
      {
        href: "/tools/pendant-light-size-calculator",
        title: "What size pendant light, and how high?",
        description:
          "Diameter and drop height, worked from your table or your room — they are different questions with different answers.",
      },
      {
        href: "/tools/planter-size-calculator",
        title: "How much compost does my planter need?",
        description:
          "Litres for a planter of any size, and a check that you are not over-potting the plant.",
      },
      {
        href: "/tools/wall-clock-size-calculator",
        title: "What size wall clock, and how high?",
        description:
          "Diameter from the furniture below, the run of bare wall, or the gap above your kitchen cabinets — and where the centre of the face goes.",
      },
      {
        href: "/tools/vase-size-calculator",
        title: "What size vase for your flowers?",
        description:
          "Stem length to buy for a vase you own, or the vase for stems you have, plus how many it takes to look full.",
      },
    ],
  },
  {
    heading: "Outdoor living",
    tools: [
      {
        href: "/tools/patio-heater-size-calculator",
        title: "What size patio heater or fire pit?",
        description:
          "kW and BTU converted both ways, and the output your seating area actually needs once wind is accounted for.",
      },
      {
        href: "/tools/garden-furniture-material-selector",
        title: "Which garden furniture material?",
        description:
          "Teak, aluminium, rattan or steel — what survives a British winter uncovered, and what needs oiling.",
      },
    ],
  },
  {
    heading: "Sauna and cold plunge",
    tools: [
      {
        href: "/tools/sauna-size-calculator",
        title: "What size sauna do I need?",
        description:
          "Matched against real in-stock saunas, using each one's own stated capacity.",
      },
      {
        href: "/tools/cold-plunge-size-calculator",
        title: "What size cold plunge do I need?",
        description:
          "Sized by fit rather than headcount, with the water volume that decides your running cost.",
      },
      {
        href: "/tools/contrast-therapy-planner",
        title: "Sauna and cold plunge protocol builder",
        description:
          "How long, how cold, how many rounds and in what order, built around what you want from it.",
      },
    ],
  },
  {
    heading: "Design",
    tools: [
      {
        href: "/tools/garden-visualiser",
        title: "AI Design Studio",
        description:
          "Upload a photo of your own space and see it redesigned with real products from Kaiku.",
      },
    ],
  },
] as const;

export default function ToolsPage() {
  return (
    <Container className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <Eyebrow>Tools</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          Free planning tools
        </h1>
        <p className="text-muted mt-6 text-lg leading-relaxed text-pretty">
          Fourteen calculators for the questions that come before a purchase —
          what size, how high, will it fit, how much will it hold. All of them
          work from measurements you can go and take, and none of them need an
          email address.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {GROUPS.map((group) => (
            <section key={group.heading}>
              <h2 className="text-muted text-[12px] font-medium tracking-[0.16em] uppercase">
                {group.heading}
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {group.tools.map((tool) => (
                  <AppLink
                    key={tool.href}
                    href={tool.href}
                    className="border-line hover:border-ink rounded-xl border p-6 transition-colors"
                  >
                    <p className="text-ink font-display text-xl">
                      {tool.title}
                    </p>
                    <p className="text-muted mt-2 text-[14px] leading-relaxed">
                      {tool.description}
                    </p>
                  </AppLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
