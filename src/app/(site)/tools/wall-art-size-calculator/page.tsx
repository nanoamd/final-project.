import type { Metadata } from "next";

import { WallArtSizeCalculator } from "@/components/shared/wall-art-size-calculator";
import { ToolPage } from "@/features/storefront/components/tools/tool-page";
import { getProductsByCategory } from "@/lib/sanity/queries";
import { buildMetadata } from "@/lib/seo/metadata";

export const revalidate = 86400;

export const metadata: Metadata = buildMetadata({
  title: "What Size Wall Art Above Furniture or on a Bare Wall? Calculator",
  description:
    "What size canvas or framed print to hang above your sofa, console or bed — and how to size a gallery wall as one shape rather than piece by piece.",
  path: "/tools/wall-art-size-calculator",
});

export default async function WallArtSizeCalculatorPage() {
  const products = await getProductsByCategory("wall-art", { limit: 8 });

  return (
    <ToolPage
      path="/tools/wall-art-size-calculator"
      heading="What size wall art, and where to hang it?"
      intro="Measure the furniture it hangs over, or the bare run of wall it fills. We will give you the width to shop at and the height to hang it — and if it's a gallery wall, the arrangement's outer edges rather than any one piece."
      method={{
        heading: "One shape, not several",
        paragraphs: [
          "The proportion is the same one this site's mirror and wall clock calculators use, because it is the same eye trick: art reads as belonging to the furniture below it at roughly two-thirds of that furniture's width. On bare wall, without furniture to anchor it, the usable run itself becomes the constraint instead.",
          "A gallery wall follows the identical proportion — it is sized by its outer edges, as if the whole arrangement were one canvas. A cluster of five small prints spanning the right two-thirds is correctly sized even though any single print in it looks too small on its own. Individual frames in the group usually sit 5-8cm apart: tight enough to read as one arrangement, loose enough that each piece still stands on its own.",
          "Height follows this site's mirror convention exactly, because the eye treats a picture and a mirror the same way once they're on the wall: 20cm above the furniture below, or 145cm to the centre — the gallery convention — on bare wall with nothing to anchor to.",
        ],
      }}
      faqs={[
        {
          question: "What size art should go above a sofa?",
          answer:
            "About two-thirds of the sofa's width. A 210cm sofa suits art (or a gallery arrangement) spanning roughly 125-160cm, with the bottom edge 20cm above the top of the sofa back.",
        },
        {
          question: "How do you size a gallery wall?",
          answer:
            "As one shape, not piece by piece. Work out the target width for the whole arrangement using the two-thirds rule, then lay the individual frames out to fill that footprint with 5-8cm between them — the spacing that reads as one group rather than a scatter.",
        },
        {
          question: "How high should you hang a picture?",
          answer:
            "145cm to the centre of the piece is the gallery convention, used by galleries and interior designers alike because it puts the centre at eye level for an adult standing in front of it. Above furniture, that becomes 20cm clear above the furniture top instead.",
        },
        {
          question:
            "Is a big single piece or a gallery wall better for a small room?",
          answer:
            "Either works at the same overall footprint — the two-thirds proportion doesn't care whether it's one canvas or six small prints. A single large piece is simpler to hang and rehang; a gallery wall is easier to build gradually and swap pieces in and out of.",
        },
      ]}
      products={products}
      productsHeading="Wall art currently in stock"
      guides={[
        {
          slug: "wall-art-size-and-arrangement",
          title: "What size wall art, and gallery wall or single piece?",
        },
      ]}
    >
      <WallArtSizeCalculator />
    </ToolPage>
  );
}
