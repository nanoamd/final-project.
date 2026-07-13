import { AppLink } from "@/components/ui/app-link";

const ROOMS = [
  { label: "Kitchens", href: "/shop" },
  { label: "Living Room", href: "/shop" },
  { label: "Bedroom", href: "/shop" },
  { label: "Bathroom", href: "/shop" },
];

export function ShopByRoom() {
  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1280px] px-6 py-20 sm:px-8 lg:px-12">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <p className="text-brass mb-3 text-[13px] font-medium tracking-[0.24em] uppercase">
              Shop by room
            </p>
            <h2 className="font-display text-canvas text-4xl tracking-tight text-balance sm:text-5xl">
              Everything for every room.
            </h2>
          </div>
          <AppLink
            href="/shop"
            className="text-brass hidden shrink-0 items-center gap-2 text-sm tracking-wide sm:flex"
          >
            View all rooms <span aria-hidden>→</span>
          </AppLink>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {ROOMS.map((room) => (
            <AppLink
              key={room.label}
              href={room.href}
              className="group relative aspect-3/4 overflow-hidden rounded-xl ring-1 ring-white/10"
            >
              {/* Tonal placeholder — swap for room photography. */}
              <div className="from-basalt-raise absolute inset-0 bg-gradient-to-br via-black/40 to-black/70 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex items-end p-5">
                <span className="text-canvas text-sm font-medium tracking-[0.1em] uppercase">
                  {room.label}
                </span>
              </div>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
