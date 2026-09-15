import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { TOOL_GROUPS } from "@/lib/content/tools";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Tools",
  description:
    "Seventeen free calculators for the questions that come before a purchase — mirror and pendant sizing, dining table fit, bed and sofa size, TV and wall art sizing, planter volume, patio heat output, sauna capacity.",
  path: "/tools",
});

export default function ToolsPage() {
  return (
    <Container className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <Eyebrow>Tools</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          Free planning tools
        </h1>
        <p className="text-muted mt-6 text-lg leading-relaxed text-pretty">
          Seventeen calculators for the questions that come before a purchase —
          what size, how high, will it fit, how much will it hold. All of them
          work from measurements you can go and take, and none of them need an
          email address.
        </p>

        <div className="mt-14 flex flex-col gap-12">
          {TOOL_GROUPS.map((group) => (
            <section key={group.heading}>
              <h2 className="text-muted text-[12px] font-medium tracking-[0.16em] uppercase">
                {group.heading}
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {group.tools.map((tool) => (
                  <AppLink
                    key={tool.href}
                    href={tool.href}
                    className="border-line hover:border-ink rounded-xl border p-6 transition-colors"
                  >
                    <p className="text-ink font-display text-xl">
                      {tool.title}
                    </p>
                    <p className="text-muted mt-2 text-[14px] leading-relaxed">
                      {tool.description}
                    </p>
                  </AppLink>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
