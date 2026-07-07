import type { Metadata } from "next";

import { ScrollStage } from "@/features/experience";

export const metadata: Metadata = {
  title: "The Becoming",
  description:
    "A preview build of Kaiku's cinematic scroll experience — not yet linked from the main site.",
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
