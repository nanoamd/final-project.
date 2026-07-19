import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { createClient } from "@/lib/supabase/server";
import { signOutCustomer } from "@/server/actions/customer-auth";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Container width="narrow" className="py-20 md:py-28">
        <Eyebrow>Account</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Your orders and saved pieces
        </h1>
        <p className="text-muted mt-6 max-w-md text-[15px] leading-relaxed">
          Sign in to see your order history and manage your saved addresses.
          Checkout still works as a guest either way.
        </p>
        <div className="mt-8 flex gap-3">
          <AppLink href="/account/login" className={buttonVariants({})}>
            Sign in
          </AppLink>
          <AppLink
            href="/account/signup"
            className={buttonVariants({ variant: "secondary" })}
          >
            Create an account
          </AppLink>
        </div>
      </Container>
    );
  }

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Account</Eyebrow>
          <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            {user.email}
          </h1>
        </div>
        <form action={signOutCustomer}>
          <button
            type="submit"
            className="text-muted hover:text-ink text-[13px] transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <AppLink
          href="/account/orders"
          className="border-line hover:border-ink rounded-xl border p-6 transition-colors"
        >
          <p className="font-display text-ink text-lg">Order history</p>
          <p className="text-muted mt-1 text-[14px]">
            Track past orders placed on this account.
          </p>
        </AppLink>
        <AppLink
          href="/account/addresses"
          className="border-line hover:border-ink rounded-xl border p-6 transition-colors"
        >
          <p className="font-display text-ink text-lg">Saved addresses</p>
          <p className="text-muted mt-1 text-[14px]">
            Manage the delivery addresses on your account.
          </p>
        </AppLink>
      </div>
    </Container>
  );
}
