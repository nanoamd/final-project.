import { ChevronDown, LayoutGrid, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { BreadcrumbJsonLd } from "@/components/shared/json-ld";
import { AppLink } from "@/components/ui/app-link";
import { buttonVariants } from "@/components/ui/button";
import { CategoryAccordion } from "@/features/storefront/components/category/category-accordion";
import { TrustBar } from "@/features/storefront/components/home/trust-bar";
import { formatPrice } from "@/lib/format";
import { resolveIcon } from "@/lib/icons";
import {
  getCategories,
  getCategory,
  getDepartments,
  getHomepage,
  getProduct,
  getProductsByCategory,
  getTotalProductCount,
} from "@/lib/sanity/queries";
import type {
  SanityCategory,
  SanityDepartment,
  SanityProduct,
} from "@/types/sanity-content";

/**
 * Collection — the dark, editorial browse experience. With no `categorySlug`
 * it is the "All Collections" index (a grid of category tiles); with a slug it
 * narrows to a single collection (a grid of product tiles). With a `roomSlug`
 * instead, it narrows the category grid to one department ("room") — used by
 * `/shop/room/[room]`, which the header's room tabs link to. Both share the
 * breadcrumb hero, the category sidebar and the Garden Studio promo.
 */
export async function CollectionIndex({
  categorySlug,
  roomSlug,
  styleTag,
}: {
  categorySlug?: string;
  roomSlug?: string;
  styleTag?: string;
}) {
  const [allCategories, totalProducts, departments, homepage] =
    await Promise.all([
      getCategories(),
      getTotalProductCount(),
      roomSlug ? getDepartments() : Promise.resolve([]),
      getHomepage(),
    ]);
  const productOfTheWeek = homepage?.curatedFeaturedProductSlug
    ? await getProduct(homepage.curatedFeaturedProductSlug)
    : null;

  const active = categorySlug
    ? ((await getCategory(categorySlug)) ?? undefined)
    : undefined;
  if (categorySlug && !active) notFound();

  const room = roomSlug
    ? (departments.find((d) => d.slug === roomSlug) ?? undefined)
    : undefined;
  if (roomSlug && !room) notFound();

  const categories = room
    ? allCategories.filter((c) => c.departmentSlug === room.slug)
    : allCategories;

  const products = active
    ? await getProductsByCategory(active.slug, { styleTag })
    : [];

  const allHref = room ? `/shop/room/${room.slug}` : "/shop";

  return (
    <div className="bg-basalt">
      <CollectionHero category={active} room={room} />

      <div className="mx-auto max-w-[1440px] px-6 pb-16 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[248px_1fr] lg:gap-12">
          <Sidebar
            categories={categories}
            totalProducts={totalProducts}
            activeSlug={active?.slug}
            allHref={allHref}
            productOfTheWeek={productOfTheWeek}
          />

          <div>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <p className="text-canvas/55 flex items-center gap-2 text-[13px]">
                {active
                  ? `Showing ${active.name}`
                  : room
                    ? `Showing ${room.name}`
                    : "Showing all collections"}
                {active && styleTag ? (
                  <AppLink
                    href={`/shop/${active.slug}`}
                    className="border-brass/40 text-brass flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase transition-colors hover:bg-white/5"
                  >
                    {styleTag}
                    <span aria-hidden>×</span>
                  </AppLink>
                ) : null}
              </p>
              <div className="text-canvas/70 flex items-center gap-2 text-[13px]">
                <span className="text-canvas/45">Sort by:</span>
                Featured
                <ChevronDown className="size-4" strokeWidth={1.6} aria-hidden />
              </div>
            </div>

            {active ? (
              <>
                {/* The category sidebar (sibling links) is lg:flex-only, so
                    without this a phone viewing one category has no way to
                    switch to another except backing out to the header nav. */}
                <div className="-mx-6 mt-6 flex [scrollbar-width:none] gap-2 overflow-x-auto px-6 pb-1 sm:-mx-8 sm:px-8 lg:hidden">
                  <MobileCategoryPill
                    href={allHref}
                    label="All"
                    active={!active}
                  />
                  {categories.map((category) => (
                    <MobileCategoryPill
                      key={category.slug}
                      href={`/shop/${category.slug}`}
                      label={category.name}
                      active={category.slug === active.slug}
                    />
                  ))}
                </div>
                {products.length ? (
                  <div className="mt-6 grid grid-cols-2 gap-5 lg:mt-8 lg:grid-cols-3">
                    {products.map((product) => (
                      <ProductTile key={product.slug} product={product} />
                    ))}
                  </div>
                ) : (
                  <EmptyCollection name={active.name} />
                )}
                {/* Same cards the desktop sidebar shows, relocated below the
                    grid on mobile rather than dropped — a phone shopper
                    should still see Product of the Week and Design Studio,
                    just after the products they came here for. */}
                <div className="mt-10 flex flex-col gap-6 lg:hidden">
                  {productOfTheWeek?.image ? (
                    <ProductOfTheWeekCard product={productOfTheWeek} />
                  ) : null}
                  <GardenStudioCard />
                </div>
              </>
            ) : categories.length ? (
              <div className="mt-8">
                <CategoryAccordion categories={categories} room={room} />
              </div>
            ) : (
              <EmptyCollection name={room?.name ?? "This room"} />
            )}
          </div>
        </div>
      </div>

      <TrustBar />
    </div>
  );
}

function CollectionHero({
  category,
  room,
}: {
  category?: SanityCategory;
  room?: SanityDepartment;
}) {
  const title = category?.name ?? room?.name ?? "Premium outdoor living";
  const crumb = category?.name ?? room?.name ?? "All Collections";
  const shopHref = room ? `/shop/room/${room.slug}` : "/shop";
  const currentHref = category
    ? `/shop/${category.slug}`
    : room
      ? `/shop/room/${room.slug}`
      : "/shop";

  const breadcrumbItems = [
    { name: "Shop", url: "/shop" },
    ...(category && room ? [{ name: room.name, url: shopHref }] : []),
    { name: crumb, url: currentHref },
  ];

  return (
    <section className="border-b border-white/10">
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <div className="mx-auto grid max-w-[1440px] items-stretch gap-8 px-6 py-12 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12 lg:px-12 lg:py-14">
        <div className="flex flex-col justify-center">
          <nav
            aria-label="Breadcrumb"
            className="text-brass mb-5 text-[11px] font-medium tracking-[0.2em] uppercase"
          >
            <ol className="flex items-center gap-2">
              <li>
                <AppLink
                  href="/shop"
                  className="hover:text-canvas transition-colors"
                >
                  Shop
                </AppLink>
              </li>
              {category && room ? (
                <>
                  <li aria-hidden className="text-brass/50">
                    /
                  </li>
                  <li>
                    <AppLink
                      href={shopHref}
                      className="hover:text-canvas transition-colors"
                    >
                      {room.name}
                    </AppLink>
                  </li>
                </>
              ) : null}
              <li aria-hidden className="text-brass/50">
                /
              </li>
              <li aria-current="page">{crumb}</li>
            </ol>
          </nav>
          {category || room ? (
            <h1 className="text-canvas font-display text-[2.6rem] leading-[1.02] tracking-[-0.01em] sm:text-[3.4rem]">
              {title}
            </h1>
          ) : (
            <h1 className="text-canvas font-display text-[2.6rem] leading-[1.02] tracking-[-0.01em] sm:text-[3.4rem]">
              Premium outdoor living,
              <br />
              curated for{" "}
              <span className="text-brass italic">every space.</span>
            </h1>
          )}
          <p className="text-canvas/65 mt-5 max-w-md text-[15px] leading-relaxed">
            {category?.description ??
              room?.description ??
              "Timeless design. The finest materials. Built for life outdoors."}
          </p>
          {room ? (
            <AppLink
              href={`/shop/room/${room.slug}/all`}
              className={buttonVariants({
                variant: "accent",
                className: "mt-7 w-fit",
              })}
            >
              Shop All {room.name}
            </AppLink>
          ) : null}
        </div>

        {/* Desktop only. Below lg this sat under the heading and the "Shop All"
            button and cost 252px (measured, image plus the gap-8 above it) on a
            844px phone screen before a single product — and it is the same
            photo on every room, because no department has a heroImage set in
            Sanity so they all fall through to the static garden-after.jpg. So
            it was most of a third of the screen spent on a generic image that
            told the visitor nothing about the room they had chosen. The
            two-column desktop layout is untouched; below lg the grid simply has
            one child, which is what also removes that gap. */}
        <div className="relative hidden overflow-hidden rounded-xl lg:block lg:min-h-0">
          {/* No `priority`. It emits a preload link with no media condition,
              so a phone downloaded this image — at the 3840w variant — despite
              it being display:none, paying for a hero it never shows. Without
              it the image is lazy, and browsers do not fetch a lazy image
              inside a display:none box. On desktop it is in the initial
              viewport, so it still loads immediately; only the preload hint is
              gone. `sizes` drops the mobile branch for the same reason. */}
          <Image
            src={category?.image ?? room?.image ?? "/images/garden-after.jpg"}
            alt=""
            fill
            sizes="45vw"
            className="object-cover"
          />
          <div className="from-basalt/50 absolute inset-0 bg-gradient-to-r to-transparent" />
        </div>
      </div>
    </section>
  );
}

function Sidebar({
  categories,
  totalProducts,
  activeSlug,
  allHref,
  productOfTheWeek,
}: {
  categories: SanityCategory[];
  totalProducts: number;
  activeSlug?: string;
  allHref: string;
  productOfTheWeek?: SanityProduct | null;
}) {
  const allActive = !activeSlug;
  return (
    <aside className="hidden flex-col gap-8 py-8 lg:flex">
      <div>
        <p className="text-canvas/45 mb-4 text-[11px] font-semibold tracking-[0.18em] uppercase">
          Browse Categories
        </p>
        <ul className="flex flex-col">
          <SidebarLink
            href={allHref}
            icon={LayoutGrid}
            label="All Collections"
            count={totalProducts}
            active={allActive}
          />
          {categories.map((category) => (
            <SidebarLink
              key={category.slug}
              href={`/shop/${category.slug}`}
              icon={resolveIcon(category.iconName)}
              label={category.name}
              count={category.productCount}
              active={category.slug === activeSlug}
            />
          ))}
        </ul>
      </div>

      {productOfTheWeek?.image ? (
        <ProductOfTheWeekCard product={productOfTheWeek} />
      ) : null}

      <GardenStudioCard />
    </aside>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  count,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <li>
      <AppLink
        href={href}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
          active
            ? "bg-brass/10 text-brass"
            : "text-canvas/70 hover:text-canvas hover:bg-white/5"
        }`}
      >
        <Icon
          className={`size-[18px] shrink-0 ${active ? "text-brass" : "text-canvas/45 group-hover:text-canvas/70"}`}
          strokeWidth={1.5}
          aria-hidden
        />
        <span className="flex-1">{label}</span>
        {typeof count === "number" ? (
          <span
            className={`text-[12px] tabular-nums ${active ? "text-brass/80" : "text-canvas/35"}`}
          >
            {count}
          </span>
        ) : null}
      </AppLink>
    </li>
  );
}

function MobileCategoryPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <AppLink
      href={href}
      className={`shrink-0 rounded-full border px-4 py-2 text-[12px] font-medium whitespace-nowrap transition-colors ${
        active
          ? "border-brass/40 bg-brass/10 text-brass"
          : "text-canvas/70 hover:text-canvas border-white/10"
      }`}
    >
      {label}
    </AppLink>
  );
}

function ProductOfTheWeekCard({ product }: { product: SanityProduct }) {
  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group bg-basalt-raise hover:border-brass/40 block rounded-xl border border-white/8 p-5 transition-colors"
    >
      <p className="text-brass mb-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
        Kaiku&rsquo;s Product of the Week
      </p>
      <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg">
        <Image
          src={
            product.cardImageWide ??
            product.cardImage ??
            product.image ??
            "/images/garden-after.jpg"
          }
          alt=""
          fill
          sizes="248px"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
        {(product.studioImageWide ?? product.studioImage) ? (
          <Image
            src={(product.studioImageWide ?? product.studioImage)!}
            alt=""
            fill
            sizes="248px"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}
      </div>
      <p className="text-canvas font-display mt-4 text-[16px] leading-tight">
        {product.name}
      </p>
      <p className="text-brass mt-1 text-[13px]">
        From {formatPrice(product.price)}
      </p>
    </AppLink>
  );
}

function GardenStudioCard() {
  return (
    <div className="bg-basalt-raise rounded-xl border border-white/8 p-5">
      <p className="text-brass mb-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
        Design Studio
      </p>
      <p className="text-canvas font-display text-[22px] leading-tight">
        Visualise it in your space
      </p>
      <p className="text-canvas/55 mt-3 text-[13px] leading-relaxed">
        Upload a photo of any room and see our products in your space instantly.
      </p>
      <AppLink
        href="/tools/garden-visualiser"
        className="border-brass/50 text-brass hover:bg-brass mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md border text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:text-white"
      >
        Try Design Studio <span aria-hidden>→</span>
      </AppLink>
      <div className="relative mx-auto mt-6 aspect-[9/16] w-[62%] overflow-hidden rounded-[1.4rem] border-4 border-black/60 border-white/8">
        <Image
          src="/images/garden-after.jpg"
          alt=""
          fill
          sizes="160px"
          className="object-cover"
        />
      </div>
    </div>
  );
}

function ProductTile({ product }: { product: SanityProduct }) {
  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group hover:border-brass/40 relative block overflow-hidden rounded-xl border border-white/8 transition-colors"
    >
      <div className="relative aspect-[4/5]">
        {(product.cardImage ?? product.image) ? (
          <Image
            src={product.cardImage ?? product.image!}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 30vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="from-basalt-card to-basalt absolute inset-0 bg-gradient-to-br" />
        )}
        {/* A lifestyle/action shot swaps to the plain studio photo on
            hover, when an editor has tagged one — a customer scanning the
            grid sees the product's real setting, then the clean product
            shot once they're paying attention to this specific card. */}
        {product.studioImage ? (
          <Image
            src={product.studioImage}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 30vw"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}
        <div className="from-basalt/90 absolute inset-0 bg-gradient-to-t to-transparent" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-canvas font-display text-[17px] leading-tight">
          {product.name}
        </p>
        <p className="text-brass mt-1 text-[13px]">
          From {formatPrice(product.price)}
        </p>
      </div>
    </AppLink>
  );
}

function EmptyCollection({ name }: { name: string }) {
  return (
    <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/8 px-6 py-20 text-center">
      <p className="text-canvas font-display text-2xl">{name} — coming soon</p>
      <p className="text-canvas/55 mt-3 max-w-sm text-[14px] leading-relaxed">
        We&rsquo;re curating this collection now. Browse another category, or
        get in touch and we&rsquo;ll let you know as soon as it&rsquo;s ready.
      </p>
      <AppLink
        href="/contact"
        className="border-brass/50 text-brass hover:bg-brass mt-6 flex h-11 items-center gap-2 rounded-md border px-6 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:text-white"
      >
        Get in touch <span aria-hidden>→</span>
      </AppLink>
    </div>
  );
}
