import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { schemaTypes } from "./src/sanity/schemaTypes";
import { structure } from "./src/sanity/structure";

/**
 * Root Sanity Studio config, embedded into the Next.js app at /studio (see
 * src/app/studio/[[...tool]]/page.tsx). Reads env directly (not the strict
 * src/env.ts schema) with safe placeholders so the Studio module can always
 * be constructed — including during `next build` before real credentials
 * exist — without throwing.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "kaiku",
  title: "Kaiku",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
});
