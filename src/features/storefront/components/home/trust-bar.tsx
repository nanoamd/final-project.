import { Gem, Headset, Sparkles, Truck } from "lucide-react";
import { ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    icon: Sparkles,
    title: "Garden Studio",
    copy: "Visualise your space in seconds.",
  },
  { icon: Gem, title: "Premium Brands", copy: "Curated, world-class brands." },
  { icon: Headset, title: "Expert Support", copy: "Real people. Real advice." },
  {
    icon: Truck,
    title: "Delivery & Install",
    copy: "Nationwide, with optional install.",
  },
  {
    icon: ShieldCheck,
    title: "5 Year Warranty",
    copy: "Peace of mind, extended.",
  },
];

export function TrustBar() {
  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-7 px-6 py-8 sm:px-8 md:grid-cols-3 lg:grid-cols-5 lg:px-12">
        {ITEMS.map((item, i) => (
          <div
            key={item.title}
            className={`flex items-start gap-3 ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}
          >
            <item.icon
              className="text-brass mt-0.5 size-5 shrink-0"
              strokeWidth={1.5}
              aria-hidden
            />
            <div>
              <p className="text-canvas text-[12px] font-semibold tracking-[0.08em] uppercase">
                {item.title}
              </p>
              <p className="text-canvas/55 mt-0.5 text-[13px] leading-snug">
                {item.copy}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
