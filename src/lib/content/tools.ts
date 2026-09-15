/**
 * Every planning tool on the site, in one place.
 *
 * Lives here rather than inside the /tools page because two things need it now:
 * that page, and the sidebar on every guide and journal post. A second copy
 * would drift the moment a tool is renamed, and a guide linking to a tool that
 * has moved is worse than a guide linking to no tool at all.
 *
 * Grouped, because there are seventeen and a flat list of seventeen reads as a
 * dump. Ordered within each group by how often the question gets asked rather
 * than by when the tool was built.
 */
export const TOOL_GROUPS = [
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
        href: "/tools/sofa-size-calculator",
        title: "What size sofa fits my room?",
        description:
          "The largest straight sofa your wall and floor space take, with enough left in front of it to reach the coffee table or walk past.",
      },
      {
        href: "/tools/tv-unit-size-calculator",
        title: "What size TV, and what size unit under it?",
        description:
          "The screen size your seating distance actually suits, and the unit width it needs — not the same number as its diagonal.",
      },
      {
        href: "/tools/wall-art-size-calculator",
        title: "What size wall art, and where to hang it?",
        description:
          "The width to shop at above furniture or on a bare wall, and — for a gallery wall — the arrangement's outer edges, not any one piece.",
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

export type ToolGroup = (typeof TOOL_GROUPS)[number];
export type Tool = ToolGroup["tools"][number];
