import type { Metadata } from "next";

import { ScrollStage } from "@/features/experience";

export const metadata: Metadata = {
  title: "The Becoming",
  description:
    "A preview build of Kaiku's cinematic scroll experience — not yet linked from the main site.",
  // Its own description says it is not linked from the main site, which is
  // exactly the page Google should not be indexing. It had no canonical and
  // no inbound links either, so it was an orphan competing with real pages.
  robots: { index: false, follow: false },
};

/**
 * Isolated preview route for "The Becoming" scroll experience. Deliberately
 * NOT linked from navigation or the homepage yet — this is where the engine
 * is built and iterated on before any decision to wire it into intent-based
 * homepage routing (see the architecture brief).
 */
export default function ExperiencePage() {
  return <ScrollStage />;
}
