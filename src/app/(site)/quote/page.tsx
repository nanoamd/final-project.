import type { Metadata } from "next";

import { AppLink } from "@/components/ui/app-link";
import { siteConfig } from "@/config/site";
import {
  QUOTE_PILLARS,
  WHAT_HAPPENS_NEXT,
  WHAT_HELPS,
} from "@/features/quote/options";
import { QuoteForm } from "@/features/quote/quote-form";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Request a Quote | Saunas, Outdoor Kitchens & Furniture | Kaiku",
  description:
    "Tell us about your space and we will prepare an itemised written quotation, with the lead time stated against every line. No obligation.",
  path: "/quote",
});

/**
 * The quotation page.
 *
 * It replaces a "coming soon" placeholder that every product page linked to from
 * its Request a Quote button — so the highest-intent action on the site led to a
 * dead end. The old page also carried `robots: noindex`, which was right for a
 * placeholder and wrong for this.
 *
 * Two things shape the layout. The form is the page, so it starts high rather than
 * after a wall of reassurance. And everything around it is a promise that is true
 * today: a small business reading each enquiry itself is a genuine advantage over a
 * call centre, but only if the page says that plainly instead of implying a showroom
 * and a sales team that do not exist.
 */
export default function QuotePage() {
  return (
    <div className="bg-canvas text-ink">
      <section className="border-line border-b">
        <div className="mx-auto max-w-[1180px] px-6 pt-12 pb-10 sm:px-8 lg:px-12 lg:pt-20">
          <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase">
            Request a quote
          </p>
          <h1 className="font-display mt-4 max-w-2xl text-[2rem] leading-[1.05] tracking-tight sm:text-[2.75rem]">
            Tell us about the space, and we&rsquo;ll price it properly
          </h1>
          <p className="text-graphite mt-5 max-w-xl text-[16px] leading-relaxed">
            Some things cannot be priced from a product page — a sauna that has
            to get down a side return, an outdoor kitchen built around an
            existing wall, a whole room of furniture at once. Send us the
            details and you will get an itemised quotation in writing, with the
            lead time stated against every line.
          </p>

          <ul className="mt-9 grid gap-6 sm:grid-cols-3">
            {QUOTE_PILLARS.map((pillar) => (
              <li key={pillar.title}>
                <p className="text-ink text-[14px] font-semibold">
                  {pillar.title}
                </p>
                <p className="text-muted mt-1.5 text-[13px] leading-relaxed">
                  {pillar.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-12 sm:px-8 lg:grid-cols-[1fr_20rem] lg:gap-16 lg:px-12 lg:py-16">
        <div>
          <QuoteForm />
        </div>

        {/* Sidebar, and second in the DOM so a phone reaches the form first. It is
            reference material: useful beside the form on a wide screen, not worth a
            screen and a half of scrolling before it on a narrow one. */}
        <aside className="flex flex-col gap-10">
          <section>
            <h2 className="font-display text-lg tracking-tight">
              What happens next
            </h2>
            <ol className="mt-4 flex flex-col gap-5">
              {WHAT_HAPPENS_NEXT.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span
                    aria-hidden
                    className="text-brass text-[12px] font-semibold tabular-nums"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="text-ink block text-[14px] font-medium">
                      {step.title}
                    </span>
                    <span className="text-muted mt-1 block text-[13px] leading-relaxed">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-line bg-paper border p-5">
            <h2 className="font-display text-lg tracking-tight">
              What helps us quote faster
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {WHAT_HELPS.map((item) => (
                <li
                  key={item}
                  className="text-graphite flex gap-2 text-[13px] leading-relaxed"
                >
                  <span aria-hidden className="text-brass">
                    &middot;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg tracking-tight">
              Rather just email?
            </h2>
            <p className="text-graphite mt-3 text-[13px] leading-relaxed">
              Send the same detail to{" "}
              <AppLink
                href={`mailto:${siteConfig.email}`}
                className="text-brass underline underline-offset-2"
              >
                {siteConfig.email}
              </AppLink>{" "}
              and it reaches exactly the same place.
            </p>
            <p className="text-muted mt-3 text-[13px] leading-relaxed">
              We answer by email rather than by phone, which is how one person
              can read every enquiry properly instead of taking messages.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
