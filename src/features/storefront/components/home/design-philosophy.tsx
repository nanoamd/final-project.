import Image from "next/image";

/**
 * Design Philosophy — a large editorial split. Text-led, one considered
 * image. No CTA — this section exists to state a point of view, not sell.
 */
export function DesignPhilosophy() {
  return (
    <section className="bg-basalt border-y border-white/10">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-20 lg:px-12 lg:py-28">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl lg:aspect-[5/4]">
          <Image
            src="/images/cold-ripple.jpg"
            alt="Still water at dawn"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div>
          <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            Our Philosophy
          </p>
          <h2 className="text-canvas font-display text-3xl leading-[1.1] tracking-tight text-balance sm:text-4xl lg:text-[2.75rem]">
            We buy for the decade, not the season
          </h2>
          <div className="text-canvas/70 mt-6 flex flex-col gap-4 text-[15px] leading-relaxed sm:text-base">
            <p>
              Trends move quickly. Good design doesn&rsquo;t. Every product we
              carry is chosen because it will still look considered in ten years
              — not because it photographs well today.
            </p>
            <p>
              That means natural materials over synthetic ones, joinery over
              adhesive, and manufacturers who stand behind what they make. It
              costs more upfront. It costs far less over a lifetime.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
