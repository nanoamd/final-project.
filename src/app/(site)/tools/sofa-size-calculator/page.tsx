import type { Metadata } from "next";

import { SofaSizeCalculator } from "@/components/shared/sofa-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getArticleSidebar, getToolProducts } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Sofa Fits My Room? Sofa Size Calculator",
  description:
    "Work out the largest straight sofa your wall and room actually take, with enough left in front of it to reach the coffee table or walk past.",
  path: "/tools/sofa-size-calculator",
});

export default async function SofaSizeCalculatorPage() {
  const products = await getToolProducts("sofas", { limit: 8 });
  const sidebar = await getArticleSidebar({
    slug: "sofa-size-calculator",
    categorySlug: "sofas",
    productSlugs: products.map((p) => p.slug),
  });

  return (
    <ToolPage
      path="/tools/sofa-size-calculator"
      heading="What size sofa fits my room?"
      intro="Measure the wall the sofa will back onto and the floor space in front of it. We will give you the largest straight sofa that fits with enough room left to reach the coffee table or let someone past."
      method={{
        heading: "Why there's no fixed sofa size",
        paragraphs: [
          "Unlike a UK bed, no regulation sets sofa dimensions — every maker cuts its own frame. In practice a 2-seater runs 140-180cm wide, a 3-seater 198-229cm, both roughly 85-100cm deep including the back cushion. This calculator works from the middle of each range, which is why the result is a size category to shop for rather than one exact model.",
          "In front of a sofa, 45cm is the minimum to reach a coffee table without standing up — comfortable is closer to 60cm. Where that same space is also how people reach the rest of the room, it wants 90cm instead, the same figure this site uses everywhere for 'a person can pass.'",
          "This calculator covers straight sofas only. A corner or chaise sofa is not a rectangle — the two legs of the L are usually different lengths — so checking its fit means measuring both legs against the two walls it will actually sit along, not one width-and-depth pair.",
        ],
      }}
      sections={[
        {
          heading: "How to measure a room for a sofa",
          paragraphs: [
            "Measure the wall at skirting height, not at eye height. A radiator, a skirting board with a deep profile, a door architrave and the socket the lamp has to reach all live at the bottom of the wall, and all of them take centimetres off the run you thought you had.",
            "Measure the depth from that wall to the first thing that stops you — the coffee table, the edge of the fireplace hearth, the point where the route through the room crosses. Not to the opposite wall, unless the opposite wall really is the next obstruction.",
            "Take the depth of the sofa from the manufacturer's figure including the back cushion, not the frame. Plenty of listings quote the frame, and a back cushion adds 10 to 15cm that has to go somewhere.",
            "Then mark it out on the floor. Masking tape, or newspaper, or four books at the corners — anything that lets you stand in the room and look at the footprint before it arrives. Ten minutes of tape has saved more sofas from being returned than any calculator, this one included.",
          ],
        },
        {
          heading:
            "Will it get through the door? Measure the route, not the room",
          paragraphs: [
            "This is the measurement that actually causes returns. A sofa that fits the room perfectly and will not turn the corner at the top of the stairs is still going back, and delivery crews will not take doors off their hinges or lift through a window.",
            "Walk the route from the street to the room and find the tightest point: the front door, a hall turn, a stairwell, a landing, a doorway into the room itself. At each one, measure the clear opening width with the door open, and the clear height.",
            "A sofa goes through an opening on its side, so the measurement that has to clear is the sofa's HEIGHT against the doorway's WIDTH, and its depth against the doorway's height. A 90cm-deep sofa with a 85cm-tall back needs about 90cm of clear doorway height and 85cm of width to go through upright on its side — which is why a standard 76cm internal door is the thing that stops most of them.",
            "For a turn — the corner of a hallway, or a half-landing on a staircase — what matters is the diagonal. You need the sofa's length to clear the diagonal of the turn, and a straight sofa over about 200cm rarely makes a tight 90-degree hallway turn at all.",
            "Where the route genuinely will not take it, the answer is a modular or knock-down sofa whose arms and back come off, or two smaller pieces. Both are sold specifically for this, and both are better answers than a sofa left in the front garden.",
          ],
        },
        {
          heading: "Corner sofas, chaises, and two small pieces",
          paragraphs: [
            "The calculator above covers straight sofas, because a corner sofa is not a rectangle and pretending otherwise is how people buy one that does not fit.",
            "Measure each leg of the L separately against the wall it will sit along, and measure the depth each leg projects into the room. A typical corner sofa runs 240 to 280cm on the long leg and 170 to 200cm on the return, and the two are almost never the same. Check which hand it is, too: left-hand and right-hand facing are not interchangeable, and it is decided by where the chaise is when you look at the sofa, which is the opposite of what half the listings imply.",
            "A chaise sofa is a straight sofa with one leg sticking out, so measure it as a straight sofa plus that projection. Its advantage in a small room is that it seats more without needing more wall; its cost is that the projection usually blocks the route past.",
            "Two smaller pieces — a 2-seater and an armchair, or two 2-seaters facing — very often seat the same number of people in less wall than one 3-seater, and they can be arranged to leave the route through the room open. In a room under about 3.5m this is usually the better answer, and it is almost always the easier one to get through the door.",
          ],
        },
        {
          heading: "Seat depth, seat height, and who is actually sitting on it",
          paragraphs: [
            "Fit is not only footprint. A sofa that fits the room and does not fit the people is a worse outcome, because you notice it every evening rather than once on delivery day.",
            "Seat depth — the front edge of the seat to the base of the back cushion — is the number that decides comfort more than any other, and it is rarely in the headline dimensions. Around 55 to 60cm suits most people sitting upright with their feet on the floor. 60 to 70cm is a lounging depth: excellent if that is what you want, and uncomfortable for anyone under about 5ft 6in who then sits with their legs unsupported or their back unsupported, and has to choose.",
            "Seat height is usually 40 to 50cm. Lower reads as more relaxed and is harder to get out of, which matters for anyone with a bad knee or a hip. If someone in the house struggles to stand from a low chair, 45cm and up is worth treating as a requirement rather than a preference.",
            "Arm height and style change the footprint as well as the look. A wide rolled arm can add 20cm to each end of the same seating width, so two sofas both sold as three-seaters can differ by 40cm of wall while seating identically. Where wall space is tight, a slim or track arm buys you real room.",
          ],
        },
      ]}
      faqs={[
        {
          question: "What is the standard size of a 3-seater sofa?",
          answer:
            "There is no fixed standard, but most 3-seaters fall between 198cm and 229cm wide and 85-100cm deep including the back cushion. Always check the exact model — a chaise or wide-arm design can run wider than the category suggests.",
        },
        {
          question: "How much space do you need in front of a sofa?",
          answer:
            "45cm is the minimum to reach a coffee table without standing. If that space is also how people reach the rest of the room, allow 90cm so someone can pass without climbing over the table.",
        },
        {
          question: "Will a 3-seater sofa fit a small living room?",
          answer:
            "Most 3-seaters need about 210cm of wall and 95cm of depth before clearance. In a small room, a 2-seater plus an armchair often seats the same number in less wall space than one long 3-seater does.",
        },
        {
          question: "How do I measure a corner sofa for fit?",
          answer:
            "Measure each leg of the L separately against the wall it will sit along, including the depth each leg projects into the room. A corner sofa's total footprint is rarely symmetrical, so a single width figure will not tell you whether it fits.",
        },
        {
          question: "Will a sofa fit through my door?",
          answer:
            "A sofa goes through a doorway on its side, so its height has to clear the doorway width and its depth has to clear the doorway height. A 90cm-deep sofa with an 85cm back needs roughly 90cm of clear height and 85cm of width — which is why a standard 76cm internal door stops most of them. Measure the tightest point on the whole route, not just the room's own door.",
        },
        {
          question: "How do I measure a hallway turn for a sofa?",
          answer:
            "What matters at a turn is the diagonal, not the corridor width. The sofa's length has to clear the diagonal of the corner, and a straight sofa over about 200cm rarely makes a tight 90-degree hall turn at all. Where it will not go, a knock-down or modular sofa with removable arms is what that problem is sold to solve.",
        },
        {
          question: "What seat depth should a sofa have?",
          answer:
            "55 to 60cm suits most people sitting upright with their feet on the floor. 60 to 70cm is a lounging depth — excellent if that is what you want, and awkward for anyone under about 5ft 6in, who then has to choose between supporting their back and supporting their legs. It is rarely in the headline dimensions, so ask for it.",
        },
        {
          question:
            "Is a corner sofa or two smaller sofas better in a small room?",
          answer:
            "Usually two smaller pieces. A 2-seater and an armchair often seat the same number as one 3-seater in less wall space, they can be arranged to leave the route through the room open, and they are far easier to get through a door. In a room under about 3.5m this is the answer more often than not.",
        },
        {
          question: "Does sofa arm style change how much space it needs?",
          answer:
            "Substantially. A wide rolled arm can add 20cm at each end over a slim track arm at identical seating width, so two sofas both sold as three-seaters can differ by 40cm of wall. Where wall space is the constraint, arm style buys you more room than dropping a seat does.",
        },
      ]}
      products={products}
      sidebar={sidebar}
      sidebarCategorySlug="sofas"
      productsHeading="Sofas currently in stock"
      guides={[
        {
          slug: "sofa-size-for-your-room",
          title: "What size sofa for your room, seat by seat",
        },
      ]}
    >
      <SofaSizeCalculator />
    </ToolPage>
  );
}
