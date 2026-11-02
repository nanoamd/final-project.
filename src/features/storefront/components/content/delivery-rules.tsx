import { AppLink } from "@/components/ui/app-link";
import { TWO_MAN_EXCLUDED_PLACES } from "@/lib/catalog/deliverability";
import { standardWindowForPrice } from "@/lib/catalog/delivery";
import { TWO_MAN_FROM_KG } from "@/lib/suppliers/delivery-zones";

/**
 * Kaiku's actual delivery rules, stated on the delivery page.
 *
 * ## Why this is in code
 *
 * `/delivery` carried **153 words**, measured in the browser — generalities on
 * the page a buyer checks before spending £1,900 on something that has to get
 * through their front door. Meanwhile the site already encodes the real model
 * precisely: lead times banded by price, a courier service and a two-person
 * service with different reach, and a list of postcodes the second cannot
 * serve.
 *
 * Those rules live in `delivery.ts` and `delivery-zones.ts` because the
 * product page, the basket, the checkout guard and the Merchant feed all have
 * to agree with them. Writing them out again in Sanity would make a second
 * copy that can drift from the first, and the first is the one that decides
 * what actually happens to an order.
 *
 * So the page states them **from the same constants**. The editor's own copy
 * still renders above this; this is the part that cannot be wrong.
 */

/** The bands `standardWindowForPrice` actually applies, with its own answers. */
const BANDS = [
  { label: "Under £50", example: 25 },
  { label: "£50 to £120", example: 90 },
  { label: "Over £120", example: 500 },
] as const;

export function DeliveryRules() {
  return (
    <section className="border-line mt-14 border-t pt-10">
      <h2 className="font-display text-ink text-2xl tracking-tight">
        The rules in full
      </h2>

      <h3 className="text-ink mt-8 text-[15px] font-medium">What it costs</h3>
      <p className="text-graphite mt-2 text-[15px] leading-relaxed">
        Nothing. Delivery is free to any UK address and is already included in
        the price you see — there is no separate carriage line at checkout, and
        no surcharge for the Highlands, the islands or Northern Ireland.
      </p>

      <h3 className="text-ink mt-8 text-[15px] font-medium">When it arrives</h3>
      <p className="text-graphite mt-2 text-[15px] leading-relaxed">
        Each product page states its own window, and the basket states the
        slowest one in your order — an order arrives when its last piece does.
        Where a supplier has not confirmed a date, the window comes from the
        price, which tracks how the piece is made and shipped:
      </p>
      {/* Generated from standardWindowForPrice rather than typed out, so the
          page cannot drift from the rule the product page and the feed use. */}
      <dl className="border-line mt-4 divide-y border-y text-[15px]">
        {BANDS.map((band) => (
          <div key={band.label} className="flex justify-between gap-6 py-3">
            <dt className="text-graphite">{band.label}</dt>
            <dd className="text-ink font-medium">
              {standardWindowForPrice(band.example)}
            </dd>
          </div>
        ))}
      </dl>

      <h3 className="text-ink mt-8 text-[15px] font-medium">
        How it arrives, and the one limit
      </h3>
      <p className="text-graphite mt-2 text-[15px] leading-relaxed">
        Smaller pieces come by courier and reach everywhere. Anything large or
        heavy — broadly {TWO_MAN_FROM_KG}kg and up, though the supplier&rsquo;s
        own routing decides it — travels on a two-person service, and that
        service does not reach {TWO_MAN_EXCLUDED_PLACES}.
      </p>
      <p className="text-graphite mt-3 text-[15px] leading-relaxed">
        Product pages say so on the pieces it affects, and the basket checks
        your postcode before you pay rather than after. If you are in one of
        those areas and want something on that service,{" "}
        <AppLink
          href="/contact"
          className="text-ink underline decoration-[0.5px] underline-offset-4"
        >
          ask us
        </AppLink>{" "}
        and we will see what can be arranged.
      </p>

      <h3 className="text-ink mt-8 text-[15px] font-medium">
        Where it is left
      </h3>
      <p className="text-graphite mt-2 text-[15px] leading-relaxed">
        To your door, not into a room of choice. It is the reason a piece that
        would be £1,600 elsewhere is not, and it is worth measuring your doorway
        and any stair turn against the boxed dimensions on the product page
        before ordering — that is where a long box stops, not the front door.
      </p>
    </section>
  );
}
