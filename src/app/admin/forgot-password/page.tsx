"use client";

import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestAdminPasswordReset } from "@/server/actions/admin-auth";

export default function AdminForgotPasswordPage() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await requestAdminPasswordReset(
        new FormData(event.currentTarget),
      );
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8">
        <p className="font-display text-xl text-neutral-900">Kaiku Admin</p>

        {sent ? (
          <p className="mt-4 text-sm text-neutral-500">
            If that email is registered, we&rsquo;ve sent a link to reset your
            password. It&rsquo;ll expire after a while, so use it soon.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-500">
              Enter your email and we&rsquo;ll send you a reset link.
            </p>
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium tracking-[0.08em] text-neutral-500 uppercase">
                  Email
                </span>
                <Input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                />
              </label>

              <Button type="submit" disabled={pending} className="mt-2">
                {pending ? "Sending…" : "Send reset link"}
              </Button>

              {error ? (
                <p className="text-[13px] text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </>
        )}

        <Link
          href="/admin/login"
          className="mt-6 block text-sm text-neutral-500 hover:text-neutral-900"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
