import Image from "next/image";

const IMAGES = [
  { src: "/images/image-1784323811220.webp", label: "Evening, terrace" },
  { src: "/images/image-1784323790719.webp", label: "Fire, after dark" },
  { src: "/images/image-1784323799552.webp", label: "Cedar interior" },
  { src: "/images/image-1784323803462.webp", label: "Steam, first light" },
  { src: "/images/image-1784323815382.webp", label: "Still water" },
  { src: "/images/image-1784323795679.webp", label: "Cold plunge, dawn" },
];

/**
 * Inspiration Gallery — pure photography, no products, no CTA. An
 * asymmetric grid so it reads as a curated wall rather than a product tile.
 */
export function InspirationGallery() {
  return (
    <section className="bg-basalt">
      <div className="mx-auto max-w-[1440px] px-6 py-10 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto mb-6 max-w-xl text-center sm:mb-14">
          <p className="text-brass mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            Inspiration
          </p>
          <h2 className="text-canvas font-display text-2xl leading-[1.05] tracking-tight sm:text-4xl">
            Spaces worth spending an evening in
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
          {IMAGES.map((image, i) => (
            <div
              key={image.src}
              className={`group relative overflow-hidden rounded-lg ${
                i === 0
                  ? "col-span-2 aspect-[16/9] lg:hidden"
                  : i === 5
                    ? "aspect-[3/2] lg:hidden"
                    : "aspect-[3/2]"
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
