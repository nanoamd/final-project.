import * as React from "react";

import { cn } from "@/lib/utils";

type SectionSpacing = "default" | "compact" | "spacious";

const spacing: Record<SectionSpacing, string> = {
  compact: "py-14 md:py-20",
  default: "py-20 md:py-28",
  spacious: "py-24 md:py-36",
};

export function Section({
  spacing: space = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { spacing?: SectionSpacing }) {
  return <section className={cn(spacing[space], className)} {...props} />;
}
