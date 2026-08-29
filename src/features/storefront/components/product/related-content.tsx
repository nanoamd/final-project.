import Image from "next/image";

import { AppLink } from "@/components/ui/app-link";
import { GARDEN_VISUALISER_DEPARTMENT_SLUGS } from "@/config/garden-visualiser";
import { PLANNED_TOOLS_BY_DEPARTMENT } from "@/config/planned-tools";
import { REAL_TOOLS_BY_DEPARTMENT } from "@/config/real-tools";
import type { SanityBuyingGuide, SanityPost } from "@/types/sanity-content";

interface ContentItem {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string | null;
}

interface ToolItem {
  title: string;
  href?: string;
}

/**
 * Buying guides, journal posts and tools related to this product — sits
 * after the "you may also like" carousel. Tools mixes real, working links
 * (currently just the AI Garden Visualiser, for outdoor departments) with
 * "coming soon" placeholders for tools on the roadmap but not yet built, so
 * the section always has something to show even before every guide/post/tool
 * exists. Renders nothing only if there's truly nothing at all — no guides,
 * no posts, and no department match for tools.
 */
export function RelatedContent({
  buyingGuides,
  posts,
  productSlug,
  departmentSlug,
}: {
  buyingGuides: SanityBuyingGuide[];
  posts: SanityPost[];
  productSlug: string;
  departmentSlug?: string | null;
}) {
  const tools: ToolItem[] = [];
  if (
    departmentSlug &&
    (GARDEN_VISUALISER_DEPARTMENT_SLUGS as readonly string[]).includes(
      departmentSlug,
    )
  ) {
    tools.push({
      title: "AI Garden Visualiser",
      href: `/tools/garden-visualiser?product=${productSlug}`,
    });
  }
  for (const tool of (departmentSlug &&
    REAL_TOOLS_BY_DEPARTMENT[departmentSlug]) ||
    []) {
    tools.push(tool);
  }
  const planned = departmentSlug
    ? (PLANNED_TOOLS_BY_DEPARTMENT[departmentSlug] ?? [])
    : [];
  for (const title of planned) {
    tools.push({ title });
  }

  if (!posts.length && !tools.length) return null;

  // The grid's column count must match how many columns actually render —
  // a fixed 3-column grid with only 1-2 real columns leaves the rest of the
  // row as dead white space. Buying guides always renders something (real
  // guides or the fallback link below), so it always counts as one column.
  const columnCount = 1 + (posts.length ? 1 : 0) + (tools.length ? 1 : 0);
  const gridColsClass =
    columnCount >= 3
      ? "md:grid-cols-2 lg:grid-cols-3"
      : columnCount === 2
        ? "md:grid-cols-2"
        : "max-w-md";

  return (
    <section className="border-line bg-paper border-t">
      <div
        className={`mx-auto grid max-w-[1280px] gap-12 px-6 py-16 sm:px-8 lg:px-12 ${gridColsClass}`}
      >
        {buyingGuides.length ? (
          <ContentColumn
            heading="Buying guides"
            basePath="/learn"
            items={buyingGuides}
          />
        ) : (
          <div>
            <h2 className="text-ink font-display text-2xl tracking-tight">
              Buying guides
            </h2>
            <p className="text-muted mt-4 text-[14px] leading-relaxed">
              We&rsquo;re still writing a guide for this category.
            </p>
            <AppLink
              href="/learn"
              className="text-brass mt-3 inline-block text-[13px] font-medium underline underline-offset-4"
            >
              Browse all buying guides →
            </AppLink>
          </div>
        )}
        {posts.length ? (
          <ContentColumn
            heading="From the journal"
            basePath="/journal"
            items={posts}
          />
        ) : null}
        {tools.length ? <ToolsColumn tools={tools} /> : null}
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
                    className="object-contain transition-transform duration-700 group-hover:scale-[1.04]"
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

function ToolsColumn({ tools }: { tools: ToolItem[] }) {
  return (
    <div>
      <h2 className="text-ink font-display text-2xl tracking-tight">Tools</h2>
      <ul className="mt-6 flex flex-col gap-4">
        {tools.map((tool) =>
          tool.href ? (
            <li key={tool.title}>
              <AppLink
                href={tool.href}
                className="group flex items-center justify-between gap-4"
              >
                <span className="text-ink group-hover:text-brass font-display text-[16px] leading-snug transition-colors">
                  {tool.title}
                </span>
                <span aria-hidden className="text-brass">
                  →
                </span>
              </AppLink>
            </li>
          ) : (
            <li
              key={tool.title}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-muted text-[16px] leading-snug">
                {tool.title}
              </span>
              <span className="text-muted shrink-0 text-[11px] font-medium tracking-[0.1em] uppercase">
                Coming soon
              </span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
