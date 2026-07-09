import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/**
 * The first viewport. Basalt ground (dark, clay-toned — no green), brass as
 * the CTA/highlight accent. The background stands in for a real photograph —
 * swap the tonal div below for an <Image> once Kaiku has its own shoot; the
 * layout, copy and motion don't need to change when it lands.
 */
export function Hero() {
  return (
    <section className="bg-basalt relative isolate flex min-h-[100dvh] flex-col overflow-hidden">
      <div aria-hidden className="absolute inset-0">
        <div
          className="absolute inset-0 animate-[hero-zoom_9s_ease-out_forwards] motion-reduce:animate-none"
          style={{
            background:
              "radial-gradient(120% 90% at 20% 84%, color-mix(in srgb, var(--color-brass) 30%, transparent), transparent 60%), var(--color-basalt)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
          style={{ backgroundImage: GRAIN }}
        />
        <div className="from-basalt via-basalt/40 absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t to-transparent" />
      </div>

      <Container className="relative mt-auto flex flex-col pt-32 pb-20 sm:pb-24 lg:pb-28">
        <div className="max-w-2xl">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 font-display text-canvas text-[2.5rem] leading-[1.05] tracking-tight text-balance duration-700 motion-reduce:animate-none sm:text-6xl lg:text-[4.75rem]">
            Build the home{" "}
            <span className="text-brass">you never want to leave.</span>
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-3 text-canvas/70 mt-6 max-w-md text-lg leading-relaxed text-pretty delay-150 duration-700 motion-reduce:animate-none">
            See your future garden before you build it.
          </p>
          <div className="animate-in fade-in slide-in-from-bottom-2 mt-10 flex flex-wrap items-center gap-4 delay-300 duration-700 motion-reduce:animate-none">
            <AppLink
              href="/guided-buying"
              className={buttonVariants({ variant: "accent", size: "lg" })}
            >
              Start Designing
            </AppLink>
            <AppLink
              href="/shop"
              className={buttonVariants({ variant: "onDark", size: "lg" })}
            >
              Explore Products
            </AppLink>
          </div>
        </div>
      </Container>

      <div className="animate-in fade-in relative flex justify-center pb-8 delay-700 duration-1000 motion-reduce:animate-none">
        <span
          aria-hidden
          className="border-canvas/35 flex h-9 w-6 items-start justify-center rounded-full border p-1.5"
        >
          <span className="bg-canvas/70 h-1.5 w-1 rounded-full motion-safe:animate-bounce" />
        </span>
      </div>
    </section>
  );
}
