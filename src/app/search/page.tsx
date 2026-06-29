import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <ComingSoon
      eyebrow="Search"
      title="Search the catalogue and knowledge base"
      intro="A single place to search across products and guidance. It arrives alongside the full catalogue."
    />
  );
}
