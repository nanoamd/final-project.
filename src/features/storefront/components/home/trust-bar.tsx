import { Award, Gem, ShieldCheck, Truck } from "lucide-react";

const ITEMS = [
  { icon: Gem, title: "Premium Quality", copy: "Built to last." },
  { icon: Award, title: "Expert Design", copy: "Curated by experts." },
  { icon: Truck, title: "Nationwide Delivery", copy: "& optional install." },
  {
    icon: ShieldCheck,
    title: "5 Year Warranty",
    copy: "For complete peace of mind.",
  },
];

export function TrustBar() {
  return (
    <section className="bg-basalt border-y border-white/8">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-y-10 px-6 py-12 sm:px-8 lg:grid-cols-4 lg:px-12">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex flex-col items-center px-4 text-center lg:border-r lg:border-white/10 lg:last:border-r-0"
          >
            <item.icon
              className="text-brass mb-4 size-7"
              strokeWidth={1.4}
              aria-hidden
            />
            <p className="text-canvas text-[13px] font-medium tracking-[0.12em] uppercase">
              {item.title}
            </p>
            <p className="text-canvas/55 mt-1.5 text-sm">{item.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
