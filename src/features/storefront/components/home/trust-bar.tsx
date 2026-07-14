import { Headset, Sparkles, Truck } from "lucide-react";
import { ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    icon: Truck,
    title: "Premium Delivery",
    copy: "White glove delivery across the UK",
  },
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    copy: "The finest materials, built to last",
  },
  {
    icon: Sparkles,
    title: "Designed to Inspire",
    copy: "Timeless pieces for beautiful spaces",
  },
  {
    icon: Headset,
    title: "Expert Support",
    copy: "Our team is here to help you every step",
  },
];

/**
 * Trust bar — the four-up reassurance strip shared by Home and Collection.
 * Sits directly on the near-black ground with hairline dividers between items.
 */
export function TrustBar() {
  return (
    <section className="bg-basalt border-y border-white/10">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-y-8 px-6 py-9 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-y-0 lg:px-12">
        {ITEMS.map((item, i) => (
          <div
            key={item.title}
            className={
              i > 0
                ? "flex items-start gap-3.5 lg:border-l lg:border-white/10 lg:pl-8"
                : "flex items-start gap-3.5"
            }
          >
            <item.icon
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
        ))}
      </div>
    </section>
  );
}
