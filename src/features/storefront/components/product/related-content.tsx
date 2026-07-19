import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import type { SanityBuyingGuide, SanityPost } from "@/types/sanity-content";

interface ContentItem {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string | null;
}

/** Buying guides and journal posts related to this product — sits after the "you may also like" carousel. Renders nothing if there's no related content. */
export function RelatedContent({
  buyingGuides,
  posts,
}: {
  buyingGuides: SanityBuyingGuide[];
  posts: SanityPost[];
}) {
  if (!buyingGuides.length && !posts.length) return null;

  return (
    <section className="border-line bg-paper border-t">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-16 sm:px-8 md:grid-cols-2 lg:px-12">
        {buyingGuides.length ? (
          <ContentColumn
            heading="Buying guides"
            basePath="/learn"
            items={buyingGuides}
          />
        ) : null}
        {posts.length ? (
          <ContentColumn
            heading="From the journal"
            basePath="/journal"
            items={posts}
          />
        ) : null}
      </div>
    </section>
  );
}

function ContentColumn({
  heading,
  basePath,
  items,
}: {
  heading: string;
  basePath: string;
  items: ContentItem[];
}) {
  return (
    <div>
      <h2 className="text-ink font-display text-2xl tracking-tight">
        {heading}
      </h2>
      <ul className="mt-6 flex flex-col gap-6">
        {items.map((item) => (
          <li key={item.slug}>
            <AppLink
              href={`${basePath}/${item.slug}`}
              className="group flex items-center gap-4"
            >
              <div className="border-line bg-canvas relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg border">
                {item.coverImage ? (
                  <Image
                    src={item.coverImage}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                ) : null}
              </div>
              <div>
                <p className="text-ink group-hover:text-brass font-display text-[16px] leading-snug transition-colors">
                  {item.title}
                </p>
                {item.excerpt ? (
                  <p className="text-muted mt-1 line-clamp-2 text-[13px] leading-relaxed">
                    {item.excerpt}
                  </p>
                ) : null}
              </div>
            </AppLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
