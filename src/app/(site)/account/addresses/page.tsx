import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { AddressBook } from "@/features/storefront/components/account/address-book";
import { createClient } from "@/lib/supabase/server";
import { listAddresses } from "@/server/actions/addresses";

export const metadata: Metadata = { title: "Saved Addresses" };

export default async function AccountAddressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/account/login");

  const addresses = await listAddresses();

  return (
    <Container width="narrow" className="py-20 md:py-28">
      <AppLink
        href="/account"
        className="text-muted hover:text-ink text-[13px]"
      >
        ← Account
      </AppLink>
      <Eyebrow className="mt-4">Account</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
        Saved addresses
      </h1>

      <div className="mt-10">
        <AddressBook addresses={addresses} />
      </div>
    </Container>
  );
}
