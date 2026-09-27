import Link from "next/link";

import { siteConfig } from "@/config/site";

/**
 * What actually happens after somebody pays.
 *
 * ## Why this section exists
 *
 * Kaiku was reviewed professionally and the finding that mattered was not
 * about design: _"the site doesn't seem real, someone could order and nothing
 * show up."_ Counted on the live homepage, the reviewer had a point — zero
 * mentions of a review, a guarantee, or a trading address, and one mention of
 * the person who runs it, across 1,329 words.
 *
 * The instinct is to answer that with reassurance badges. That is the wrong
 * answer and actively makes it worse: "Secure Checkout" and "UK-Based
 * Support" sit on the bottom of every drop-ship template ever built, so a
 * wary shopper reads them as the thing a fake shop says. **Generic trust
 * signals are evidence of nothing, and shoppers know it.**
 *
 * What answers "nothing will show up" is a specific, checkable account of what
 * will show up, in what order, and what to do when it does not. Every line
 * below is something the system genuinely does today:
 *
 * - card payments really are handled by Stripe, which is why the shop never
 *   receives a card number
 * - the confirmation email really does send, and has since `RESEND_API_KEY`
 *   went live on 20 August
 * - the returns window really is 14 days, matching `/returns` and the
 *   `MerchantReturnPolicy` in the product structured data
 *
 * Nothing here is aspirational. If a claim in this file stops being true, it
 * comes out of this file the same day.
 */

interface Step {
  title: string;
  body: string;
  /** What to do when this step does not happen — the actually reassuring bit. */
  ifNot?: string;
}

const STEPS: Step[] = [
  {
    title: "You pay",
    body: "Your card is handled by Stripe, the same company that processes payments for Deliveroo and Just Eat. Kaiku never sees or stores your card number.",
  },
  {
    title: "A confirmation email arrives within a minute",
    body: "It lists what you bought, what you paid, and the delivery window for each piece.",
    ifNot:
      "If it has not arrived in ten minutes, check spam, then email us — an order we cannot confirm is one we want to know about.",
  },
  {
    title: "Your order goes to the maker",
    body: "Kaiku holds no warehouse. Your piece is picked and packed by the workshop or supplier that made it, which is why the delivery window is measured in weeks rather than days on larger furniture.",
  },
  {
    title: "You get tracking when it is dispatched",
    body: "Courier and tracking number, by email, as soon as it is booked onto a van.",
  },
  {
    title: "You have 14 days to change your mind",
    body: "From the day it arrives, for any reason. Faulty or damaged is different and has no deadline at all.",
  },
];

export function AfterYouOrder() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase">
            After you order
          </p>
          <h2 className="text-ink font-display mt-3 text-[26px] leading-[1.15] sm:text-[34px]">
            Exactly what happens next
          </h2>
          <p className="text-graphite mt-4 text-[15px] leading-[1.7]">
            Buying from a shop you have not heard of is a reasonable thing to
            hesitate over. Here is the whole sequence, including what to do if a
            step does not happen.
          </p>
        </div>

        <ol className="border-line mt-10 grid gap-px border-t sm:mt-14 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="border-line border-b pt-5 pb-6 lg:border-b-0 lg:pr-6"
            >
              <span className="border-brass text-brass flex size-7 items-center justify-center rounded-full border text-[11px] font-medium">
                {i + 1}
              </span>
              <h3 className="text-ink mt-3.5 text-[15px] leading-snug font-medium">
                {step.title}
              </h3>
              <p className="text-graphite mt-2 text-[13px] leading-[1.65]">
                {step.body}
              </p>
              {step.ifNot ? (
                <p className="text-muted mt-2.5 text-[12px] leading-[1.6] italic">
                  {step.ifNot}
                </p>
              ) : null}
            </li>
          ))}
        </ol>

        <p className="text-graphite mt-8 text-[13px] leading-[1.7]">
          Questions before you spend anything are welcome —{" "}
          <a
            href={`mailto:${siteConfig.email}`}
            className="text-brass underline underline-offset-4"
          >
            {siteConfig.email}
          </a>{" "}
          reaches us directly. The{" "}
          <Link
            href="/delivery"
            className="text-ink underline underline-offset-4"
          >
            delivery
          </Link>{" "}
          and{" "}
          <Link
            href="/returns"
            className="text-ink underline underline-offset-4"
          >
            returns
          </Link>{" "}
          pages have the full detail.
        </p>
      </div>
    </section>
  );
}
