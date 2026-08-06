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
        // 16px on mobile, back to 14px from sm up. iOS Safari zooms the whole
        // viewport in when a focused field's font-size is under 16px, and it
        // does not zoom back out afterwards — the visitor is left on a page
        // scaled up and scrolled sideways. The footer newsletter form uses
        // this input, so at 14px it did that on every page of the site.
        // Desktop is unchanged.
        "border-line bg-paper text-ink placeholder:text-muted focus-visible:border-ink h-11 w-full rounded-full border px-5 text-base transition-colors focus-visible:outline-none sm:text-sm",
        className,
      )}
      {...props}
    />
  );
}
