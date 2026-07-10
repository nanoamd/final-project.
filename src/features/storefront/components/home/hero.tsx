import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * The first viewport, now carried by a real photograph (fire against black —
 * CC0 placeholder, to be swapped for Kaiku's own shoot). The image is mirrored
 * so the flames sit bottom-right and the headline reads over the dark left.
 */
export function Hero() {
  return (
    <section className="bg-basalt relative isolate flex min-h-[100dvh] flex-col overflow-hidden">
      <div aria-hidden className="absolute inset-0">
        <Image
          src="/images/hero-fire.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-x-[-1] animate-[hero-zoom_12s_ease-out_forwards] object-cover motion-reduce:animate-none"
        />
        {/* Legibility + mood: darken the left where the text sits, and settle
            the whole frame into the basalt palette. */}
        <div className="from-basalt/95 via-basalt/45 absolute inset-0 bg-gradient-to-r to-transparent" />
        <div className="from-basalt absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t to-transparent" />
      </div>

      <Container className="relative mt-auto flex flex-col pt-32 pb-20 sm:pb-24 lg:pb-28">
        <div className="max-w-2xl">
          <h1 className="animate-in fade-in slide-in-from-bottom-4 font-display text-canvas text-[2.5rem] leading-[1.05] tracking-tight text-balance duration-700 motion-reduce:animate-none sm:text-6xl lg:text-[4.75rem]">
            Build the home{" "}
            <span className="text-brass">you never want to leave.</span>
          </h1>
          <p className="animate-in fade-in slide-in-from-bottom-3 text-canvas/75 mt-6 max-w-md text-lg leading-relaxed text-pretty delay-150 duration-700 motion-reduce:animate-none">
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
