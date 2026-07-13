import { Sofa } from "lucide-react";

import { AppLink } from "@/components/ui/app-link";

const ROOMS = [
  "Kitchens",
  "Living Room",
  "Bedroom",
  "Bathroom",
  "Dining Room",
  "Outdoor",
];

export function ShopByRoom() {
  return (
    <section className="bg-basalt border-b border-white/10">
      <div className="mx-auto max-w-[1280px] px-6 py-14 sm:px-8 lg:px-12">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-brass mb-2 text-[12px] font-medium tracking-[0.24em] uppercase">
              Shop by room
            </p>
            <h2 className="font-display text-canvas text-3xl tracking-tight text-balance sm:text-4xl">
              Everything for every room.
            </h2>
          </div>
          <AppLink
            href="/shop"
            className="text-brass hidden shrink-0 items-center gap-2 text-[13px] tracking-wide sm:flex"
          >
            View all rooms <span aria-hidden>→</span>
          </AppLink>
        </div>

        <div className="-mx-6 flex gap-3 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]">
          {ROOMS.map((room) => (
            <AppLink
              key={room}
              href="/shop"
              className="group relative aspect-3/4 w-[42%] shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10 sm:w-[22%] lg:w-[calc((100%-3.75rem)/6)]"
            >
              <div className="from-basalt-raise absolute inset-0 bg-gradient-to-br via-black/40 to-black/70 transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 flex flex-col items-center justify-end gap-2 p-4">
                <Sofa
                  className="text-brass mb-auto mt-4 size-6"
                  strokeWidth={1.4}
                  aria-hidden
                />
                <span className="text-canvas text-[13px] font-medium tracking-[0.08em] uppercase">
                  {room}
                </span>
              </div>
            </AppLink>
          ))}
        </div>
      </div>
    </section>
  );
}
