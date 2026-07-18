import { Newsletter } from "@/components/shared/newsletter";
import { subscribeToNewsletter } from "@/server/actions/newsletter";

/**
 * Newsletter — minimal, centred, closing the homepage before the footer.
 * Reuses the existing shared Newsletter form; only the framing is new.
 */
export function JournalSignup() {
  return (
    <section className="bg-basalt-deep">
      <div className="mx-auto max-w-lg px-6 py-10 text-center sm:px-8 sm:py-20 lg:py-24">
        <h2 className="text-canvas font-display text-2xl leading-[1.05] tracking-tight sm:text-4xl">
          Stay Inspired
        </h2>
        <p className="text-canvas/60 mt-4 text-[15px] leading-relaxed">
          Design inspiration, buying guides and carefully selected new arrivals
          — occasionally, never as noise.
        </p>
        <div className="mt-8 flex justify-center">
          <Newsletter tone="dark" onSubscribe={subscribeToNewsletter} />
        </div>
      </div>
    </section>
  );
}
