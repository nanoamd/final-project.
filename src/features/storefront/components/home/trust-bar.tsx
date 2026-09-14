import { resolveIcon } from "@/lib/icons";
import type { TrustBarItem } from "@/types/sanity-content";

/**
 * Only rendered when the Sanity homepage has no trustBarItems — a fallback for
 * an empty or unreachable dataset, not the live copy.
 *
 * It used to claim "White glove delivery across the UK", "The finest materials,
 * built to last" and "Our team is here to help you every step". None of those
 * were true. Kaiku's largest supplier delivers pallets to the kerb and asks the
 * customer to dispose of the pallet; nobody has inspected the materials; and
 * the team is one person. A fallback that can render on a bad deploy is not the
 * place for claims that cannot be stood behind, so these now mirror what the
 * live Sanity copy actually says.
 */
const DEFAULT_ITEMS: TrustBarItem[] = [
  {
    iconName: "truck",
    title: "Free UK Mainland Delivery",
    copy: "On every product",
  },
  {
    iconName: "shield-check",
    title: "Clear Product Details",
    copy: "Materials, dimensions and delivery times",
  },
  {
    iconName: "sparkles",
    title: "Secure Checkout",
    copy: "Safe, encrypted payments",
  },
  {
    iconName: "headset",
    title: "UK-Based Support",
    copy: "Questions answered before you buy",
  },
];

/**
 * Trust bar — the four-up reassurance strip shared by Home and Collection.
 * Sits directly on the near-black ground with hairline dividers between items.
 */
export function TrustBar({ items }: { items?: TrustBarItem[] }) {
  const list = items?.length ? items : DEFAULT_ITEMS;

  return (
    <section className="bg-basalt border-y border-white/10">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-4 gap-y-5 px-6 py-6 sm:px-8 sm:py-9 lg:grid-cols-4 lg:gap-y-0 lg:px-12">
        {list.map((item, i) => {
          const Icon = resolveIcon(item.iconName);
          return (
            <div
              key={item.title}
              className={
                i > 0
                  ? "flex items-start gap-2.5 lg:gap-3.5 lg:border-l lg:border-white/10 lg:pl-8"
                  : "flex items-start gap-2.5 lg:gap-3.5"
              }
            >
              <Icon
                className="text-brass mt-0.5 size-5 shrink-0 lg:size-6"
                strokeWidth={1.4}
                aria-hidden
              />
              <div className="min-h-[3.25rem] lg:min-h-0">
                <p className="text-canvas text-[11px] font-semibold tracking-[0.1em] uppercase lg:text-[12px] lg:tracking-[0.12em]">
                  {item.title}
                </p>
                <p className="text-canvas/50 mt-1 text-[12px] leading-snug lg:text-[13px]">
                  {item.copy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
