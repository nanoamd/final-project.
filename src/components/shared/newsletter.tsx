"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Newsletter sign-up. The submit is intentionally a client-only confirmation —
 * there is no email provider wired yet, and we will not fake a subscription.
 * Replace `onSubmit` with a server action once an ESP is connected.
 */
export function Newsletter({
  tone = "dark",
  className,
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p
        className={cn(
          "text-sm leading-relaxed",
          tone === "dark" ? "text-canvas/80" : "text-muted",
          className,
        )}
      >
        Thank you. We&rsquo;ll be in touch with considered writing on garden
        wellness — never noise.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full max-w-md flex-col gap-3 sm:flex-row",
        className,
      )}
    >
      <Input
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email address"
        aria-label="Email address"
        className={cn(
          tone === "dark" &&
            "border-canvas/25 text-canvas placeholder:text-canvas/45 focus-visible:border-canvas bg-transparent",
        )}
      />
      <Button
        type="submit"
        className={cn(
          "shrink-0",
          tone === "dark" && "bg-canvas text-ink hover:bg-sand",
        )}
      >
        Subscribe
      </Button>
    </form>
  );
}
