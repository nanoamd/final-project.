import { PortableText } from "@portabletext/react";
import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ContactForm } from "@/features/storefront/components/content/contact-form";
import { portableTextComponents } from "@/lib/sanity/portable-text-components";
import { getPageBySlug, getSiteSettings } from "@/lib/sanity/queries";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("contact");
  return { title: page?.title ?? "Contact Us" };
}

export default async function ContactPage() {
  const [page, settings] = await Promise.all([
    getPageBySlug("contact"),
    getSiteSettings(),
  ]);

  const title = page?.title ?? "Contact Us";
  const intro =
    page?.intro ?? "We're here to help with sizing, planning and anything else.";

  return (
    <Container className="py-20 md:py-28">
      <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
            {title}
          </h1>
          <p className="text-muted mt-6 text-lg leading-relaxed text-pretty">{intro}</p>

          {page?.body?.length ? (
            <div className="mt-8">
              <PortableText value={page.body} components={portableTextComponents} />
            </div>
          ) : null}

          {settings?.email || settings?.phone ? (
            <dl className="border-line mt-8 flex flex-col gap-3 border-t pt-6 text-[15px]">
              {settings?.email ? (
                <div className="flex gap-3">
                  <dt className="text-muted w-16 shrink-0">Email</dt>
                  <dd>
                    <a href={`mailto:${settings.email}`} className="text-brass">
                      {settings.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {settings?.phone ? (
                <div className="flex gap-3">
                  <dt className="text-muted w-16 shrink-0">Phone</dt>
                  <dd className="text-ink">{settings.phone}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>

        <ContactForm />
      </div>
    </Container>
  );
}
