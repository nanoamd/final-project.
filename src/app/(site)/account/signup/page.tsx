import type { Metadata } from "next";

import { safeNextPath } from "@/lib/safe-next-path";

import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

/**
 * A Server Component so `?next=` can be read from the `searchParams` prop and
 * sanitised before it reaches the client. See the login page for the reasoning.
 */
export default async function AccountSignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <SignupForm next={safeNextPath(params.next)} />;
}
