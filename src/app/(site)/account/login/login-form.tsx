"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { AppLink, toRouterHref } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInCustomer } from "@/server/actions/customer-auth";

/**
 * `next` is already sanitised by the page — see `safeNextPath`. It arrives here
 * as a trusted same-site path so this component can push to it directly.
 */
export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signInCustomer(new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(toRouterHref(next));
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  // Carried through to signup so someone who does not have an account yet still
  // lands back at their basket rather than on the account page.
  const signupHref =
    next === "/account"
      ? "/account/signup"
      : `/account/signup?next=${encodeURIComponent(next)}`;

  return (
    <>
      <form onSubmit={onSubmit} className="mt-10 flex max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Email
          </span>
          <Input type="email" name="email" required autoComplete="email" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Password
          </span>
          <Input
            type="password"
            name="password"
            required
            autoComplete="current-password"
          />
        </label>

        <Button type="submit" disabled={pending} className="mt-2 self-start">
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        {error ? (
          <p className="text-[13px] text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <p className="text-muted mt-8 text-[14px]">
        New to Kaiku?{" "}
        <AppLink href={signupHref} className="text-brass">
          Create an account
        </AppLink>
      </p>
    </>
  );
}
