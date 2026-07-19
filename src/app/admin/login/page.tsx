"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAdmin } from "@/server/actions/admin-auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await signInAdmin(new FormData(event.currentTarget));
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8"
      >
        <p className="font-display text-xl text-neutral-900">Kaiku Admin</p>
        <p className="mt-1 text-sm text-neutral-500">Sign in to continue.</p>

        <div className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium tracking-[0.08em] text-neutral-500 uppercase">
              Email
            </span>
            <Input type="email" name="email" required autoComplete="email" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium tracking-[0.08em] text-neutral-500 uppercase">
              Password
            </span>
            <Input
              type="password"
              name="password"
              required
              autoComplete="current-password"
            />
          </label>
        </div>

        <Button type="submit" disabled={pending} className="mt-6 w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        {error ? (
          <p className="mt-3 text-[13px] text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
