import Image from "next/image";

const MATERIALS = [
  {
    name: "Timber",
    note: "Warms with age, never fades to plastic.",
    image:
      "/images/e8ec9091149d1640fadc32989c670332f9300ab175575be9e662686d4313de14.jpeg",
  },
  {
    name: "Stone",
    note: "Cold underfoot, unmoved by decades of weather.",
    image:
      "/images/1c49fd093da79eb297a40ad088ca6222255d8c42679c9f35a10ecbfde9789175.jpeg",
  },
  {
    name: "Steel",
    note: "Engineered to carry weight quietly, for a very long time.",
    image:
      "/images/9798c4c912d0100060e53f0486a5e92c8b39cf929319f8b7fcc15aa94f394db2.jpeg",
  },
  {
    name: "Flame & Ember",
    note: "The one material that was never meant to last forever — by design.",
    image:
      "/images/d76af2aac8d7432a8de9d7e1b59df60cdeab8988e151ce1c19149d938695d648.jpeg",
  },
];

/**
 * Materials — a quiet, texture-led section about quality rather than
 * specifications. Duotone treatment on the imagery keeps it feeling like a
 * material study rather than a product photo.
 */
export function Materials() {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-28">
        <div className="mx-auto mb-10 max-w-xl text-center sm:mb-14">
          <p className="text-muted mb-4 text-[11px] font-medium tracking-[0.24em] uppercase">
            What It&rsquo;s Made Of
          </p>
          <h2 className="text-ink font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl">
            Quality you can feel, not just see
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {MATERIALS.map((material) => (
            <div key={material.name} className="group">
              <div className="relative aspect-square overflow-hidden rounded-lg">
                <Image
                  src={material.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover grayscale-[35%] transition-[filter] duration-500 group-hover:grayscale-0"
                />
                <div className="bg-ink/25 absolute inset-0" />
              </div>
              <p className="text-ink font-display mt-3 text-base tracking-tight sm:mt-4 sm:text-lg">
                {material.name}
              </p>
              <p className="text-muted mt-1 text-[13px] leading-snug">
                {material.note}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
