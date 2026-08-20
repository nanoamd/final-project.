import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { createClient } from "@/lib/supabase/server";
import { signOutCustomer } from "@/server/actions/customer-auth";
import { getAuthorizedAdmin } from "@/server/auth/admin";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string }>;
}) {
  const { confirmed } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let admin: Awaited<ReturnType<typeof getAuthorizedAdmin>> = null;
  if (user) {
    try {
      admin = await getAuthorizedAdmin();
    } catch (error) {
      console.error("[account] could not resolve the admin identity", error);
    }
  }

  if (!user) {
    return (
      <Container width="narrow" className="py-20 md:py-28">
        <Eyebrow>Account</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          Your orders and saved pieces
        </h1>
        <p className="text-muted mt-6 max-w-md text-[15px] leading-relaxed">
          Sign in to see your order history and manage your saved addresses. An
          account is needed to check out, so your order is always somewhere you
          can find it.
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

      {confirmed ? (
        <p className="border-line bg-sand/20 text-ink mt-6 rounded-lg border px-4 py-3 text-[14px]">
          Your email is confirmed — welcome to Kaiku.
        </p>
      ) : null}

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
        <AppLink
          href="/saved"
          className="border-line hover:border-ink rounded-xl border p-6 transition-colors"
        >
          <p className="font-display text-ink text-lg">Saved items</p>
          <p className="text-muted mt-1 text-[14px]">
            Pieces you&rsquo;ve saved for later, ready to add to your basket.
          </p>
        </AppLink>

        {/* Only rendered for an authorised admin — a customer's page contains no
            trace of it, not even a hidden one. Deliberately dark against the
            three light tiles: this is the back of the shop, and it should never
            be mistaken for something a customer is meant to click. */}
        {admin ? (
          <AppLink
            href="/admin"
            className="bg-ink hover:bg-ink/90 rounded-xl border border-transparent p-6 transition-colors"
          >
            <p className="font-display text-canvas text-lg">Kaiku HQ</p>
            <p className="text-canvas/70 mt-1 text-[14px]">
              Orders, alerts, suppliers and emails. Only you can see this.
            </p>
          </AppLink>
        ) : null}
      </div>
    </Container>
  );
}
