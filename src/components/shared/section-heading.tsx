import * as React from "react";

import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
  titleClassName?: string;
  action?: React.ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  as: Tag = "h2",
  className,
  titleClassName,
  action,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          align === "center" && "items-center",
        )}
      >
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <Tag
          className={cn(
            "font-display text-ink text-3xl leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]",
            titleClassName,
          )}
        >
          {title}
        </Tag>
        {intro ? (
          <p className="text-muted max-w-2xl text-base leading-relaxed text-pretty sm:text-lg">
            {intro}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
