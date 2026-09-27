import { companyDetails, siteConfig, tradingAddressLine } from "@/config/site";

/**
 * The person behind the shop, named.
 *
 * ## Why being new is stated rather than hidden
 *
 * The professional review said the site does not seem real. Counted on the
 * live homepage: zero mentions of a review, a guarantee or a trading address,
 * and one mention of Damien, across 1,329 words. A visitor had no way to tell
 * whether anybody was behind it.
 *
 * The tempting fix is to look established — vague "since" dates, stock photos
 * of a team, a five-star widget with no reviews under it. All of that is worse
 * than the silence it replaces, because a shopper who suspects a shop is fake
 * is *looking* for those tells, and finding one confirms the suspicion.
 *
 * **Saying "we are new" is the stronger move.** It is disarming, it cannot be
 * caught out, and it lets everything beside it be checked: a real name, a real
 * address in Buckinghamshire, an email a person answers. A one-person shop
 * that says so reads as a one-person shop. A one-person shop pretending to be
 * John Lewis reads as a scam.
 *
 * Every fact here comes from `companyDetails`, which is the same source the
 * footer, the contact page and the Organization structured data read, so this
 * block cannot drift from the legal details.
 *
 * ## What is deliberately absent
 *
 * No review count, no rating, no "trusted by" figure, no founding-year badge.
 * Kaiku has had no orders, so any of those would be invented. The moment there
 * are real reviews they belong here; until then the honest version is the one
 * that converts.
 */
export function WhoYouBuyFrom() {
  return (
    <section className="bg-basalt border-y border-white/10">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:px-12 lg:py-20">
        <div>
          <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase">
            Who you are buying from
          </p>
          <h2 className="font-display text-canvas mt-3 text-[26px] leading-[1.15] sm:text-[32px]">
            {companyDetails.traderName}, and nobody else
          </h2>
          <div className="text-canvas/70 mt-5 space-y-4 text-[15px] leading-[1.7]">
            <p>
              Kaiku is one person in Buckinghamshire, not a warehouse and not a
              call centre. I choose every piece on this site, write every
              description on it, and answer every email that comes into it.
            </p>
            <p>
              The shop is new. There is no wall of reviews here yet, and I would
              rather say that than borrow somebody else&rsquo;s. What there is
              instead: a real name, a real address, a returns policy that does
              not need arguing with, and payments handled by Stripe so your card
              details never touch this website.
            </p>
            <p>
              If something arrives damaged or never arrives at all, you email me
              and I sort it. That is the whole customer service department.
            </p>
          </div>
        </div>

        <dl className="border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-16">
          <Fact label="Trading as">
            {companyDetails.tradingName} &mdash; {companyDetails.traderName},
            sole trader
          </Fact>
          <Fact label="Address">{tradingAddressLine()}</Fact>
          <Fact label="Email">
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-brass underline underline-offset-4"
            >
              {siteConfig.email}
            </a>
          </Fact>
          <Fact label="Payments">
            Stripe. Kaiku never sees your card number
          </Fact>
          <Fact label="Returns">14 days to change your mind</Fact>
          <Fact label="Delivery">Free to the UK mainland, on everything</Fact>
        </dl>
      </div>
    </section>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-white/10 py-3.5 first:pt-0">
      <dt className="text-canvas/45 text-[11px] font-medium tracking-[0.16em] uppercase">
        {label}
      </dt>
      <dd className="text-canvas/85 mt-1.5 text-[14px] leading-[1.6]">
        {children}
      </dd>
    </div>
  );
}
