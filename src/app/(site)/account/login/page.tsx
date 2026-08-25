import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { safeNextPath } from "@/lib/safe-next-path";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

/**
 * A Server Component so `?next=` can be read from the `searchParams` prop and
 * sanitised before it reaches the client — rather than with `useSearchParams`,
 * which would need a Suspense boundary and would hand the raw value straight to
 * `router.push`.
 */
export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next);
  const fromCheckout = next === "/cart";

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <Eyebrow>Account</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Sign in
      </h1>

      {fromCheckout ? (
        // Say why. Being bounced to a login page without explanation is the
        // point at which a basket gets abandoned.
        <p className="text-graphite mt-5 max-w-sm text-[15px] leading-relaxed">
          Kaiku orders are tied to an account so you can track delivery and find
          your paperwork later. Sign in to finish checking out — your basket is
          waiting.
        </p>
      ) : null}

      <LoginForm next={next} />
    </Container>
  );
}
