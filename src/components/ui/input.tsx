import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({
  className,
  type = "text",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      className={cn(
        "border-line bg-paper text-ink placeholder:text-muted focus-visible:border-ink h-11 w-full rounded-full border px-5 text-sm transition-colors focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
