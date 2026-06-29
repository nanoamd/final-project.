import * as React from "react";

import { cn } from "@/lib/utils";

/** Small uppercase label that sits above a heading. */
export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-muted text-[12px] font-medium tracking-[0.22em] uppercase",
        className,
      )}
      {...props}
    />
  );
}
