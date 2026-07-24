"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateAdminPassword } from "@/server/actions/admin-auth";

export default function AdminResetPasswordPage() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setPending(true);
    setError(null);
    try {
      const result = await updateAdminPassword(formData);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/admin/login"), 2000);
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

        {done ? (
          <p className="mt-4 text-sm text-neutral-500">
            Password updated. Redirecting you to sign in&hellip;
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-neutral-500">
              Choose a new password.
            </p>
            <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium tracking-[0.08em] text-neutral-500 uppercase">
                  New password
                </span>
                <Input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-medium tracking-[0.08em] text-neutral-500 uppercase">
                  Confirm new password
                </span>
                <Input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </label>

              <Button type="submit" disabled={pending} className="mt-2">
                {pending ? "Saving…" : "Save new password"}
              </Button>

              {error ? (
                <p className="text-[13px] text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
