import type { Metadata } from "next";

import { CoffeeTableSizeCalculator } from "@/components/shared/coffee-table-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getArticleSidebar, getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "Coffee Table Size Calculator: Will It Fit?",
  description:
    "Enter your sofa length and the floor in front of it. Get the coffee table length, depth and height to shop at — and whether the room will actually take it.",
  path: "/tools/coffee-table-size-calculator",
});

export default async function CoffeeTableSizeCalculatorPage() {
  const products = await getToolProducts("coffee-tables", { limit: 8 });
  const sidebar = await getArticleSidebar({
    slug: "coffee-table-size-calculator",
    categorySlug: "coffee-tables",
    productSlugs: products.map((p) => p.slug),
  });

  return (
    <ToolPage
      path="/tools/coffee-table-size-calculator"
      heading="What size coffee table, and will it fit?"
      intro="Enter the length of your sofa and, if you have it, the clear floor in front of it. You get the length, depth and height to shop at — and a check that the table goes in without blocking the way past."
      method={{
        heading: "The proportions this uses",
        paragraphs: [
          "Length is about two-thirds of the sofa, measured arm to arm. Anything from half to three-quarters reads as deliberate. Below half the table looks stranded in the middle of the floor; above three-quarters it starts to crowd the ends of the seat, and you lose the bit of floor where a side table or a standing lamp wants to go.",
          "Height matches the sofa's seat, or sits up to 5cm under it. This is the one measurement with a wrong answer rather than a range: a table taller than the seat means reaching up for a mug rather than down, and you feel it every evening. UK sofas mostly seat at 42 to 48cm, which is why 40 to 45cm is the standard coffee table height.",
          "Depth follows length rather than being a fixed number. Around half the table's length looks right — roughly 60cm deep on a 120cm table. Much squarer and a rectangular table reads as an oversized side table; much shallower and there is nowhere to put a tray down without it overhanging.",
          "The gap between the sofa and the table wants 35 to 45cm. Under 35cm you cannot get past or sit forward; over 45cm you have to stand up to reach your drink. This calculator uses 40cm, the middle of that range.",
          "Behind the table there has to be somewhere to walk, and this is the part the size rules leave out. 75cm is comfortable for a main route across a room; 45cm is the least that works at all. Give the tool the clear floor in front of your sofa and it caps the depth at what is left once both the gap and the route are taken out — which is how a table that is the right shape on paper turns out to be the wrong one in the room.",
        ],
      }}
      sections={[
        {
          heading: "How to measure for a coffee table",
          paragraphs: [
            "Three measurements, and you want a tape rather than an estimate — a 10cm error here is the difference between a table that works and one that goes back.",
            "Sofa length is arm to arm at the widest point, not the length of the seat cushions. On a sofa with rolled or flared arms the widest point is usually a few centimetres above the seat, so measure there. This is the number the two-thirds rule works from, and taking it from the cushions instead is the most common reason a table arrives looking small.",
            "Seat height is the floor to the top of the seat cushion, with the cushion uncompressed — do not sit on it first. On a deep feather-filled sofa this reads high and settles lower in use, so if yours has soft cushions, press gently and take the number it settles at.",
            "Floor depth is the clear run from the front edge of the sofa to whatever faces it: a TV unit, a wall, an armchair, or the point where the route through the room crosses. Measure at the narrowest point rather than the middle, because that is the point the table has to clear.",
            "If you are working around a rug, measure to the rug's edge only if the rug is what people walk round. Most of the time it is not — people walk on rugs — so measure to the real obstruction.",
          ],
        },
        {
          heading: "Standard coffee table sizes in the UK",
          paragraphs: [
            "Most rectangular coffee tables sold in the UK land between 100 and 130cm long, 50 and 70cm deep, and 40 and 45cm high. That is not a rule so much as what the market makes, and it is worth knowing because it tells you where you will have a real choice and where you will be hunting.",
            "Under 90cm long, the choice thins out fast and most of what is left is square or round rather than rectangular. Over 140cm, you are into a smaller and more expensive set of pieces, often sold as a 'large' or 'grand' coffee table, and frequently deeper than half their length because they are designed for a room with space around them.",
            "Round tables are usually 80 to 110cm across. A round table of a given diameter takes noticeably less floor than a rectangle of the same length, which is why it is the answer in a tight room even though it gives you less usable surface.",
            "Nests of two or three run smaller again — typically a 60 to 80cm main table with one or two beneath it. They are the honest answer when the floor cannot take a single table, because you get the surface when you need it and the floor back when you do not.",
            "None of these numbers should override what your own sofa says. A 100cm table is the standard size and completely wrong in front of a 260cm sofa.",
          ],
        },
        {
          heading: "Corner sofas, and two sofas facing each other",
          paragraphs: [
            "The two-thirds rule assumes one straight sofa, and most rooms are not that. Two cases come up often enough to be worth the adjustment.",
            "For a corner or L-shaped sofa, measure the longer arm and work from that, then take the result down by about 10 per cent. The short return eats floor that a straight sofa of the same length would leave you, and a table sized to the long arm alone tends to sit too close to the corner to walk round. A square or round table often suits a corner sofa better than a rectangle for the same reason — there is no long edge to line up with, because the seating turns.",
            "For two sofas facing each other, size to the shorter of the two, and check the gap on both sides rather than one: you need 35 to 45cm to each sofa, so the table has to fit in the middle of a span it does not control. A table that works against one sofa and leaves 25cm to the other is worse than a smaller table centred properly.",
            "Sofa and two armchairs is the easiest arrangement to get right and the easiest to overthink. Size to the sofa and ignore the chairs — as long as each chair has something in reach, which usually means a side table rather than a bigger coffee table.",
          ],
        },
        {
          heading: "Round, oval or rectangular",
          paragraphs: [
            "Shape is not only a matter of taste; each one behaves differently in a room, and in a small room the difference is the whole decision.",
            "Rectangular suits a straight sofa and a room with a clear long axis. It gives you the most usable surface for the floor it takes, and it is the easiest shape to buy because it is what most of the market makes.",
            "Round suits a tight room, a room where the route past the table is the route across the room, and a room with children in it. It has no corner to catch a shin on, it lets people cut the corner rather than walk the long way round, and it reads as less bulky than a rectangle of the same footprint. You lose surface area and you lose the ability to line it up with anything.",
            "Oval is the compromise and, in a narrow room, often the right one: it keeps most of a rectangle's surface and length while losing the corners that make a narrow room feel narrower.",
            "Square works in front of a corner sofa and in a room that is close to square itself. In front of a long straight sofa it usually reads as too small even when the footprint is right, because it does not answer the sofa's own shape.",
          ],
        },
      ]}
      faqs={[
        {
          question: "What size coffee table for a 3-seater sofa?",
          answer:
            "A typical UK 3-seater is 180 to 210cm arm to arm, which gives a coffee table of 120 to 140cm long and 60 to 70cm deep. Anything from 90cm to 155cm will look right. Height wants to be level with the seat cushion, usually 42 to 45cm.",
        },
        {
          question: "Should a coffee table be lower than the sofa?",
          answer:
            "Level with the seat, or up to 5cm lower. Lower than that and you are leaning down for everything; higher than the seat is the one genuine mistake, because you end up reaching up for a mug. Match the cushion height and you will not think about it again.",
        },
        {
          question: "How far should a coffee table be from the sofa?",
          answer:
            "35 to 45cm. Under 35cm you cannot get past the table or sit forward comfortably; over 45cm you have to stand up to reach your drink. 40cm is the number to aim at, measured from the front edge of the sofa to the near edge of the table.",
        },
        {
          question: "What is the standard size of a coffee table in the UK?",
          answer:
            "Most rectangular coffee tables sold here are 100 to 130cm long, 50 to 70cm deep and 40 to 45cm high. Round tables are usually 80 to 110cm across. That is what the market makes rather than what your room needs, so treat it as where the choice is, not as the answer.",
        },
        {
          question: "Can a coffee table be longer than the sofa?",
          answer:
            "It can, but it rarely looks right. Past about three-quarters of the sofa's length the table starts to crowd the ends of the seat and takes the floor where a side table or a floor lamp wants to go. If you need that much surface, two smaller tables side by side read better than one very long one.",
        },
        {
          question: "What size coffee table for a corner sofa?",
          answer:
            "Measure the longer arm, take two-thirds of it, then reduce that by about 10 per cent — the short return eats floor a straight sofa would have left you. A square or round table usually suits a corner sofa better than a rectangle, because the seating turns and there is no long edge to line up with.",
        },
        {
          question: "How much space do you need to walk around a coffee table?",
          answer:
            "75cm is comfortable for a main route across a room and 45cm is the least that works at all. This is the measurement most size guides leave out, and it is the one that decides whether a correctly proportioned table is actually usable. Enter your floor depth above and the calculator caps the table depth at what is left.",
        },
        {
          question: "What size round coffee table do I need?",
          answer:
            "Take the length a rectangular table would be and use about 80 per cent of it as the diameter — so a room that suits a 120cm rectangle suits a round table of roughly 90 to 100cm. Round is the answer when the floor in front of the sofa is under about 160cm, or when the way across the room passes the table.",
        },
      ]}
      products={products}
      sidebar={sidebar}
      sidebarCategorySlug="coffee-tables"
      productsHeading="Coffee tables in stock"
      guides={[
        {
          slug: "coffee-table-size-guide",
          title: "What size coffee table for your sofa?",
        },
        {
          slug: "coffee-table-top-material",
          title: "What coffee table top material actually holds up?",
        },
        {
          slug: "sofa-size-for-your-room",
          title: "What size sofa for your room, seat by seat?",
        },
        {
          slug: "side-table-height-armchair",
          title: "Side table height: getting it level with the chair arm",
        },
      ]}
    >
      <CoffeeTableSizeCalculator />
    </ToolPage>
  );
}
