import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

import { Container } from "@/components/ui/container";
import { buildMetadata } from "@/lib/seo/metadata";

/**
 * The Holo blog, embedded.
 *
 * Damien asked for this by name and supplied the snippet, so it is here and
 * working. The rest of this comment is the thing he should know before
 * deciding how much to invest in it.
 *
 * ## What this can and cannot do for search
 *
 * The embed renders its posts with JavaScript into one page. Whatever a post
 * is addressed by — a hash, a query string, or nothing at all —
 * **`/blog` is the only URL Google is given**, so the whole publication
 * competes as a single page rather than as one page per article.
 *
 * That matters because the reason to run a blog on this site is organic
 * search, and organic search works by having many URLs that each answer one
 * question. Holo's own instructions hint at the same limitation when they warn
 * about iframes: "search engines usually will not treat each post as its own
 * page". A script that injects into a div avoids the iframe problem and keeps
 * the content on this domain, which is better — but it does not by itself
 * create the separate, crawlable, indexable URLs that produce traffic.
 *
 * Two things make it earn its place:
 *
 * 1. **Per-post URLs that return content without JavaScript.** If Holo can
 *    serve `/blog/some-post` as real HTML, or give a sitemap of post URLs
 *    that resolve server-side, this becomes a genuine SEO surface. Worth
 *    asking them directly.
 * 2. **Treating it as a publishing tool rather than a ranking one.** Posts
 *    people are sent to — from email, from social, from a listing — do not
 *    need to be indexed to be useful.
 *
 * `/journal` and `/learn` already do the indexable half: server-rendered,
 * one URL per article, in the sitemap, and they are what currently earns this
 * site its editorial impressions. Nothing here replaces them.
 *
 * ## Why `afterInteractive`
 *
 * The script is third-party and renders below the fold. `beforeInteractive`
 * would block this page's own paint on a request to someone else's server;
 * `lazyOnload` would leave the container visibly empty for longer than a
 * reader will wait. `afterInteractive` runs it as soon as the page is usable.
 */
export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Writing from Kaiku on furniture, lighting, garden and the rooms they go in.",
  path: "/blog",
});

const HOLO_EMBED =
  "https://prod-api-holo-ai.fly.dev/public/seo/embed/c46e52a3-13bf-4075-8dc3-1f82198fd79f.js";

export default function BlogPage() {
  return (
    <Container className="py-12 sm:py-16 lg:py-20">
      <header className="max-w-2xl">
        <p className="text-brass text-[11px] font-medium tracking-[0.24em] uppercase">
          The Blog
        </p>
        <h1 className="text-ink font-display mt-3 text-[30px] leading-[1.12] sm:text-[40px]">
          Writing from Kaiku
        </h1>
        <p className="text-graphite mt-4 text-[15px] leading-[1.7]">
          Notes on furniture, lighting and the rooms they end up in. For the
          longer buying guides, the{" "}
          <Link href="/learn" className="text-ink underline underline-offset-4">
            learn
          </Link>{" "}
          section goes deeper, and the{" "}
          <Link
            href="/journal"
            className="text-ink underline underline-offset-4"
          >
            journal
          </Link>{" "}
          carries the editorial.
        </p>
      </header>

      {/*
       * The embed mounts here. `min-height` is deliberate: the script is
       * deferred, so without a reserved box the footer sits directly under the
       * heading and then jumps down when the posts arrive — a layout shift
       * Core Web Vitals measures and penalises.
       */}
      <div id="holo-blog" className="mt-10 min-h-[420px] sm:mt-12" />

      <Script src={HOLO_EMBED} strategy="afterInteractive" />
    </Container>
  );
}
