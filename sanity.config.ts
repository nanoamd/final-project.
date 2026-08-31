import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { sanityDataset, sanityProjectId } from "./src/lib/sanity/config";
import { WriteDescriptionAction } from "./src/sanity/actions/write-description";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

/**
 * Root Sanity Studio config, embedded into the Next.js app at /studio (see
 * src/app/studio/[[...tool]]/page.tsx).
 *
 * Shares the shape-checked values from src/lib/sanity/config.ts rather than
 * reading env directly. It previously fell back to a literal "placeholder"
 * project ID only when the variable was *absent* — so a variable that was
 * present but wrong (a token pasted into the field) was passed straight
 * through, and the Studio tried to open a project that does not exist. The
 * shared module still never throws, so the Studio module can always be
 * constructed during `next build` before real credentials exist.
 */
export default defineConfig({
  name: "kaiku",
  title: "Kaiku",
  projectId: sanityProjectId,
  dataset: sanityDataset,
  basePath: "/studio",
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
  document: {
    // The "Write description" button, on products only. Added alongside the
    // built-in actions rather than replacing them, so publish/duplicate/delete
    // all still behave exactly as they did. The VAT-correction button lives
    // next to the cost price field itself (CostPriceInput), not here — see
    // src/sanity/components/cost-price-input.tsx.
    actions: (previous, { schemaType }) =>
      schemaType === "product"
        ? [...previous, WriteDescriptionAction]
        : previous,
  },
});
