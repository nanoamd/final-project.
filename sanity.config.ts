import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { sanityDataset, sanityProjectId } from "./src/lib/sanity/config";
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
});
