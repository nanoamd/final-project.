"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { AppLink } from "@/components/ui/app-link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { signUpCustomer } from "@/server/actions/customer-auth";

export default function AccountSignupPage() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signUpCustomer(new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (result.needsEmailConfirmation) {
        setNeedsConfirmation(true);
        return;
      }
      router.push("/account");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (needsConfirmation) {
    return (
      <Container width="narrow" className="py-20 md:py-28">
        <Eyebrow>Account</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Check your email
        </h1>
        <p className="text-muted mt-6 max-w-sm text-[15px] leading-relaxed">
          We&rsquo;ve sent a confirmation link to your email address. Follow it
          to activate your account, then come back and sign in.
        </p>
      </Container>
    );
  }

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <Eyebrow>Account</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Create an account
      </h1>

      <form onSubmit={onSubmit} className="mt-10 flex max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Full name
          </span>
          <Input type="text" name="fullName" required autoComplete="name" />
        </label>
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
            minLength={8}
            autoComplete="new-password"
          />
          <span className="text-muted text-[12px]">At least 8 characters.</span>
        </label>

        <Button type="submit" disabled={pending} className="mt-2 self-start">
          {pending ? "Creating account…" : "Create account"}
        </Button>

        {error ? (
          <p className="text-[13px] text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      <p className="text-muted mt-8 text-[14px]">
        Already have an account?{" "}
        <AppLink href="/account/login" className="text-brass">
          Sign in
        </AppLink>
      </p>
    </Container>
  );
}
