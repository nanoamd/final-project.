"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitContactForm } from "@/server/actions/contact";

export function ContactForm() {
  const [submitted, setSubmitted] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await submitContactForm(new FormData(event.currentTarget));
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
      <div className="border-line bg-paper rounded-xl border p-8 text-center">
        <p className="text-ink font-display text-xl">Message received</p>
        <p className="text-muted mt-2 text-[14px] leading-relaxed">
          Thank you — our team will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Name
          </span>
          <Input type="text" name="name" required autoComplete="name" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
            Email
          </span>
          <Input type="email" name="email" required autoComplete="email" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-muted text-[12px] font-medium tracking-[0.08em] uppercase">
          Message
        </span>
        <textarea
          name="message"
          required
          rows={5}
          className="border-line bg-paper text-ink placeholder:text-muted focus-visible:border-ink rounded-lg border px-4 py-3 text-[15px] outline-none"
        />
      </label>
      <Button type="submit" disabled={pending} className="mt-2 self-start">
        {pending ? "Sending…" : "Send message"}
      </Button>
      {error ? (
        <p className="text-[13px] text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
