import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

export const metadata: Metadata = {
  title: "Tools",
  description: "Free tools to help you plan your space.",
};

const TOOLS = [
  {
    href: "/tools/garden-visualiser",
    title: "AI Design Studio",
    description:
      "Upload a photo of your own space and see it redesigned with real products from Kaiku.",
  },
  {
    href: "/tools/sauna-size-calculator",
    title: "Sauna Size & Capacity Calculator",
    description:
      "Tell us how many people will use it and we'll match you against our real in-stock saunas.",
  },
] as const;

export default function ToolsPage() {
  return (
    <Container className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <Eyebrow>Tools</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          Free planning tools
        </h1>
        <p className="text-muted mt-6 text-lg leading-relaxed text-pretty">
          A few things to help you picture the finished space before you buy.
        </p>

        <div className="mt-12 flex flex-col gap-4">
          {TOOLS.map((tool) => (
            <AppLink
              key={tool.href}
              href={tool.href}
              className="border-line hover:border-ink rounded-xl border p-6 transition-colors"
            >
              <p className="text-ink font-display text-xl">{tool.title}</p>
              <p className="text-muted mt-2 text-[14px] leading-relaxed">
                {tool.description}
              </p>
            </AppLink>
          ))}
        </div>
      </div>
    </Container>
  );
}
