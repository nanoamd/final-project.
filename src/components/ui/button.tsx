import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Button styling, shared by <Button> and by links rendered with these classes:
 *   <Link className={buttonVariants({ variant: "primary" })}>…</Link>
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-charcoal text-canvas hover:bg-graphite",
        secondary:
          "border border-ink/25 text-ink hover:border-ink hover:bg-ink hover:text-canvas",
        ghost: "text-ink hover:bg-sand",
        quiet:
          "text-ink underline decoration-line decoration-1 underline-offset-[6px] hover:decoration-ink",
        onDark:
          "border border-canvas/40 text-canvas hover:bg-canvas hover:text-ink",
        accent: "bg-brass text-basalt-deep hover:bg-brass-deep",
      },
      size: {
        sm: "h-9 px-5 text-[13px]",
        md: "h-11 px-7 text-sm",
        lg: "h-13 px-9 text-[15px]",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
