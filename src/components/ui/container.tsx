import * as React from "react";

import { cn } from "@/lib/utils";

type ContainerWidth = "default" | "wide" | "narrow";

const widths: Record<ContainerWidth, string> = {
  narrow: "max-w-3xl",
  default: "max-w-[1280px]",
  wide: "max-w-[1480px]",
};

export function Container({
  width = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { width?: ContainerWidth }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-8 lg:px-12",
        widths[width],
        className,
      )}
      {...props}
    />
  );
}
