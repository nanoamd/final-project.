"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface NewsletterSubscribeResult {
  ok: boolean;
  error?: string;
}

/**
 * Purely presentational — the actual subscribe call is injected via
 * `onSubscribe` rather than imported directly, since shared-ui components
 * aren't allowed to depend on server actions (see eslint boundaries config).
 * Callers in `feature`/`app` scope pass in the real server action.
 */
export function Newsletter({
  tone = "dark",
  className,
  onSubscribe,
}: {
  tone?: "dark" | "light";
  className?: string;
  onSubscribe: (email: string) => Promise<NewsletterSubscribeResult>;
}) {
  const [email, setEmail] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setPending(true);
    setError(null);
    try {
      const result = await onSubscribe(email);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
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
        Thank you. We&rsquo;ll be in touch with considered writing on home
        improvement and design — never noise.
      </p>
    );
  }

  return (
    <div className={cn("flex w-full max-w-md flex-col gap-2", className)}>
      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col gap-3 sm:flex-row"
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
          disabled={pending}
          className={cn(
            "shrink-0",
            tone === "dark" && "bg-canvas text-ink hover:bg-sand",
          )}
        >
          {pending ? "Subscribing…" : "Subscribe"}
        </Button>
      </form>
      {error ? (
        <p
          className={cn(
            "text-[13px]",
            tone === "dark" ? "text-canvas/70" : "text-red-600",
          )}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
