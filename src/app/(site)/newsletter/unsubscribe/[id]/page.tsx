import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { unsubscribeFromNewsletter } from "@/server/actions/newsletter-unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await unsubscribeFromNewsletter(id);

  return (
    <Container width="narrow" className="py-20 text-center md:py-28">
      <Eyebrow>Newsletter</Eyebrow>
      <h1 className="font-display text-ink mt-3 text-3xl tracking-tight">
        {result.ok ? "You're unsubscribed" : "Something went wrong"}
      </h1>
      <p className="text-muted mt-3">
        {result.ok
          ? "You won't hear from us again unless you sign up again."
          : "We couldn't process this — please email us directly and we'll remove you by hand."}
      </p>
    </Container>
  );
}
