import Image from "next/image";

const IMAGES = [
  { src: "/images/garden-after.jpg", label: "Evening, terrace" },
  { src: "/images/hero-fire.jpg", label: "Fire, after dark" },
  { src: "/images/cedar.jpg", label: "Cedar interior" },
  { src: "/images/steam-lake.jpg", label: "Steam, first light" },
  { src: "/images/dark-water.jpg", label: "Still water" },
  { src: "/images/cold-ripple.jpg", label: "Cold plunge, dawn" },
];

/**
 * Inspiration Gallery — pure photography, no products, no CTA. An
 * asymmetric grid so it reads as a curated wall rather than a product tile.
 */
export function InspirationGallery() {
  return (
    <section className="bg-basalt">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto mb-10 max-w-xl text-center sm:mb-14">
          <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            Inspiration
          </p>
          <h2 className="text-canvas font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
            Spaces worth spending an evening in
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {IMAGES.map((image, i) => (
            <div
              key={image.src}
              className={`group relative overflow-hidden rounded-lg ${
                i === 0
                  ? "col-span-2 aspect-[16/9] lg:col-span-1 lg:aspect-[3/4]"
                  : "aspect-square lg:aspect-[3/4]"
              }`}
            >
              <Image
                src={image.src}
                alt={image.label}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="from-basalt/70 pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <p className="text-canvas absolute bottom-3 left-3 text-[11px] font-medium tracking-[0.1em] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {image.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
