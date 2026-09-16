import type { Metadata } from "next";

import { TvUnitSizeCalculator } from "@/components/shared/tv-unit-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getArticleSidebar, getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size TV and TV Unit Do I Need? Size Calculator",
  description:
    "What size TV your seating distance actually calls for, and how wide a TV unit needs to be under it — worked from THX's own cinema-immersion figures and the everyday range most rooms use instead.",
  path: "/tools/tv-unit-size-calculator",
});

export default async function TvUnitSizeCalculatorPage() {
  const products = await getToolProducts("tv-units", { limit: 8 });
  const sidebar = await getArticleSidebar({
    slug: "tv-unit-size-calculator",
    categorySlug: "tv-units",
    productSlugs: products.map((p) => p.slug),
  });

  return (
    <ToolPage
      path="/tools/tv-unit-size-calculator"
      heading="What size TV, and what size unit under it?"
      intro="Enter your seating distance, your TV's size, or both. We will give you the screen size that distance actually suits, and the unit width that screen needs — not the same number as its diagonal."
      method={{
        heading: "Two figures that get confused for one",
        paragraphs: [
          "THX's own cinema-immersion guideline is distance(ft) = diagonal(in) / 10 — close enough to fill your field of view the way a cinema screen does. Most living rooms don't actually sit that close. The everyday range most retailers work to instead is 1.5-2x the screen's diagonal, which for a 55in TV is 210-280cm rather than THX's 170cm.",
          "A TV's diagonal is not its width. A 65in TV is a 65in corner-to-corner measurement on a 16:9 panel that is only about 144cm wide — and it's the width, not the diagonal, that decides what fits under it.",
          "The unit under a TV wants to be at least as wide as the screen, and ideally 5-20cm wider in total so the panel doesn't overhang the ends. Height follows a simpler rule: centre the screen 100-110cm from the floor, whether it's wall-mounted or sat on the unit.",
        ],
      }}
      sections={[
        {
          heading: "How to measure your room for a TV",
          paragraphs: [
            "Three measurements, and the first one is the one that decides everything else.",
            "Seating distance is from the back of the sofa cushion to the wall the TV will be on — not from the front of the sofa, because you sit back in it. Measure to the wall rather than to where you imagine the screen will float, because a wall-mounted TV sits within a few centimetres of the plaster and a TV on a unit sits at the unit's depth from it.",
            "Wall width is the clear run the unit has to fit inside, measured at skirting height rather than at eye height. Chimney breasts, radiators, a door that opens back against the wall, and the socket that everything has to reach all live down there, and all of them take width off the number you were working with.",
            "Screen height is set by the sofa rather than by the wall: measure the floor to your eye level when seated, which is usually 100 to 115cm. The centre of the screen wants to land there, and every other rule about TV height is an approximation of that one.",
            "If the unit has to hold a soundbar, measure the soundbar too and check it fits the shelf height as well as the width. A soundbar that will not clear the shelf lip is the most common reason a correctly sized unit gets returned.",
          ],
        },
        {
          heading: "Screen width, by size, in centimetres",
          paragraphs: [
            "Televisions are sold by a diagonal measured in inches and bought to fit a wall measured in centimetres, which is why so many end up the wrong size. These are the actual panel widths on a standard 16:9 screen, before any bezel:",
            "A 43in screen is about 96cm wide. 50in is about 111cm. 55in is about 122cm. 65in is about 144cm. 75in is about 166cm. 85in is about 188cm.",
            "Add 2 to 4cm for the bezel and the feet, which sit at or near the panel's outer edges on most modern sets — and check where the feet actually are, because a set with feet at the far corners needs a unit nearly as wide as the screen while one with a central pedestal will sit on almost anything.",
            "Then add the 5 to 20cm of unit that should show beyond the screen at each end. A 65in TV therefore wants a unit of roughly 150 to 165cm, not the 165cm that the diagonal number suggests.",
          ],
        },
        {
          heading: "Mounting on the wall, or standing on the unit",
          paragraphs: [
            "The choice changes the unit you need, so it is worth making before you buy either.",
            "Wall-mounted frees the unit's whole top surface and lets you set the height exactly, which is the main argument for it. It also fixes the height permanently, so measure your seated eye level properly first rather than mounting at the height that looks right while you are standing with a drill in your hand — this is why so many televisions end up mounted too high.",
            "The bracket needs the same thinking as a heavy mirror. On plasterboard, the bolts go into the studs or into hollow-wall anchors rated for the load, and a large screen on a cantilever arm pulls far harder than its weight suggests because the arm is a lever. Check the VESA pattern on the back of the set matches the bracket before buying either.",
            "Standing on the unit is the easier answer, it lets you change the television without touching the wall, and it puts the screen at whatever height the unit is. That is the catch: a 50cm-tall unit plus a screen centred 30cm above its base puts the centre at 80cm, which is below seated eye level. If you are standing the TV on a unit, a unit of 40 to 50cm and a screen with a low pedestal is the combination that lands nearest to right.",
            "Above a fireplace is the position people ask about most and the one that works least. A mantel at 120cm plus clearance puts the screen centre well above 140cm, which is 30cm above seated eye level, and you feel it in your neck within an hour.",
          ],
        },
        {
          heading: "Storage, cables, and the things that make it usable",
          paragraphs: [
            "The unit is furniture before it is a stand, and the parts that decide whether you keep it are not on the size label.",
            "Count what goes in it before choosing: a games console, a set-top box, a router, a soundbar and a stack of controllers is more than one shelf. Closed doors hide the clutter and block infrared remotes unless the doors are glass or the kit is on a hub — worth knowing before you buy a unit with solid doors and a set-top box that needs line of sight.",
            "Ventilation matters for anything with a power supply. A console in a sealed cupboard runs hot and throttles, so a unit with an open back, or a back panel you can cut a vent into, is worth more than it looks.",
            "Cable management is the difference between a tidy wall and a visible reason to be annoyed every day. Look for a cut-out in the back panel rather than planning to drill one, and if the TV is wall-mounted, decide now whether the cables run in trunking, behind the plaster, or straight down to the unit — the last is free and honest, and looks better than trunking painted the wrong white.",
            "Finally, check the unit's weight rating against the television. Most are comfortably above what a modern panel weighs, but a 85in screen on a slim floating unit is one of the few places this is worth reading.",
          ],
        },
      ]}
      faqs={[
        {
          question: "What size TV do I need for a 3m living room?",
          answer:
            "Using the everyday range (1.5-2x the diagonal), a 3m viewing distance suits roughly a 60-79in TV. THX's more cinema-like figure would push that to about 98in, which is bigger than most living rooms want on a permanent basis.",
        },
        {
          question: "Is my TV too big for the room?",
          answer:
            "If your seating distance is under 1.5x the screen's diagonal, it's closer than the everyday range and will feel oversized for anything but a film night. Over 2x the diagonal, and a bigger screen would use the room better.",
        },
        {
          question: "How wide should a TV unit be compared to the TV?",
          answer:
            "At least as wide as the screen itself, ideally 5-20cm wider in total. Work from the screen's actual width, not its diagonal — a 65in TV is only about 144cm wide, not 165cm.",
        },
        {
          question: "How high should a TV be mounted or placed?",
          answer:
            "Centre the screen 100-110cm from the floor, measured to the middle of the panel. That puts it at eye level for someone seated on a typical sofa, whether the TV is wall-mounted above a unit or sitting on top of it.",
        },
        {
          question: "How wide is a 65 inch TV in cm?",
          answer:
            "About 144cm of panel on a standard 16:9 screen, plus 2 to 4cm for the bezel and feet — not 165cm, which is the diagonal converted. A 55in is about 122cm, a 75in about 166cm and an 85in about 188cm. It is the width that has to fit your wall, never the diagonal.",
        },
        {
          question: "Should a TV be mounted on the wall or stand on a unit?",
          answer:
            "Mounting lets you set the height exactly and frees the unit's top, but it fixes that height permanently — so measure your seated eye level first rather than mounting at whatever looks right while standing. Standing on a unit is easier and lets you change the TV without touching the wall, but a tall unit pushes the screen below comfortable eye level.",
        },
        {
          question: "Is it bad to mount a TV above a fireplace?",
          answer:
            "It is the position people ask about most and the one that works least. A mantel at 120cm plus the clearance above it puts the screen centre well over 140cm, around 30cm above seated eye level, and you feel it in your neck within an hour. Heat from a working fire is the second problem.",
        },
        {
          question: "How high should a TV be for a seated eye level?",
          answer:
            "Centre the screen at your seated eye level, which is usually 100 to 115cm from the floor — measure it rather than assume. Every other rule about TV height is an approximation of this one, and it is why a screen mounted while standing almost always ends up too high.",
        },
        {
          question: "Does a TV unit need an open back?",
          answer:
            "If anything with a power supply lives in it, yes. A games console or an amplifier in a sealed cupboard runs hot and throttles. An open back also solves cable management, which is the difference between a tidy wall and a daily annoyance — look for a cut-out in the back panel rather than planning to cut one yourself.",
        },
      ]}
      products={products}
      sidebar={sidebar}
      sidebarCategorySlug="tv-units"
      productsHeading="TV units currently in stock"
      guides={[
        {
          slug: "tv-unit-size-and-height",
          title: "What size TV unit, and how high to mount the screen",
        },
      ]}
    >
      <TvUnitSizeCalculator />
    </ToolPage>
  );
}
