import * as React from "react";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export function PageIntro({
  eyebrow,
  title,
  intro,
  align = "left",
  children,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-line border-b", className)}>
      <Container className="py-16 md:py-24">
        <div
          className={cn(
            "flex max-w-3xl flex-col gap-6",
            align === "center" && "mx-auto items-center text-center",
          )}
        >
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
            {title}
          </h1>
          {intro ? (
            <p className="text-muted text-lg leading-relaxed text-pretty">
              {intro}
            </p>
          ) : null}
          {children}
        </div>
      </Container>
    </section>
  );
}
