import { resolveIcon } from "@/lib/icons";
import type { TrustBarItem } from "@/types/sanity-content";

const DEFAULT_ITEMS: TrustBarItem[] = [
  { iconName: "truck", title: "Premium Delivery", copy: "White glove delivery across the UK" },
  { iconName: "shield-check", title: "Quality Guaranteed", copy: "The finest materials, built to last" },
  { iconName: "sparkles", title: "Designed to Inspire", copy: "Timeless pieces for beautiful spaces" },
  { iconName: "headset", title: "Expert Support", copy: "Our team is here to help you every step" },
];

/**
 * Trust bar — the four-up reassurance strip shared by Home and Collection.
 * Sits directly on the near-black ground with hairline dividers between items.
 */
export function TrustBar({ items }: { items?: TrustBarItem[] }) {
  const list = items?.length ? items : DEFAULT_ITEMS;

  return (
    <section className="bg-basalt border-y border-white/10">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-y-8 px-6 py-9 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-y-0 lg:px-12">
        {list.map((item, i) => {
          const Icon = resolveIcon(item.iconName);
          return (
            <div
              key={item.title}
              className={
                i > 0
                  ? "flex items-start gap-3.5 lg:border-l lg:border-white/10 lg:pl-8"
                  : "flex items-start gap-3.5"
              }
            >
              <Icon
                className="text-brass mt-0.5 size-6 shrink-0"
                strokeWidth={1.4}
                aria-hidden
              />
              <div>
                <p className="text-canvas text-[12px] font-semibold tracking-[0.12em] uppercase">
                  {item.title}
                </p>
                <p className="text-canvas/50 mt-1 text-[13px] leading-snug">
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
