import { ChevronDown, LayoutGrid, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AppLink } from "@/components/ui/app-link";
import { TrustBar } from "@/features/storefront/components/home/trust-bar";
import { formatPrice } from "@/lib/format";
import { resolveIcon } from "@/lib/icons";
import {
  getCategories,
  getCategory,
  getDepartments,
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
}: {
  categorySlug?: string;
  roomSlug?: string;
}) {
  const [allCategories, totalProducts, departments] = await Promise.all([
    getCategories(),
    getTotalProductCount(),
    roomSlug ? getDepartments() : Promise.resolve([]),
  ]);

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

  const products = active ? await getProductsByCategory(active.slug) : [];

  return (
    <div className="bg-basalt">
      <CollectionHero category={active} room={room} />

      <div className="mx-auto max-w-[1440px] px-6 pb-16 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[248px_1fr] lg:gap-12">
          <Sidebar
            categories={categories}
            totalProducts={totalProducts}
            activeSlug={active?.slug}
            allHref={room ? `/shop/room/${room.slug}` : "/shop"}
          />

          <div>
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
              <p className="text-canvas/55 text-[13px]">
                {active
                  ? `Showing ${active.name}`
                  : room
                    ? `Showing ${room.name}`
                    : "Showing all collections"}
              </p>
              <div className="text-canvas/70 flex items-center gap-2 text-[13px]">
                <span className="text-canvas/45">Sort by:</span>
                Featured
                <ChevronDown className="size-4" strokeWidth={1.6} aria-hidden />
              </div>
            </div>

            {active ? (
              products.length ? (
                <div className="mt-8 grid grid-cols-2 gap-5 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductTile key={product.slug} product={product} />
                  ))}
                </div>
              ) : (
                <EmptyCollection name={active.name} />
              )
            ) : categories.length ? (
              <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((category) => (
                  <CategoryTile
                    key={category.slug}
                    category={category}
                    icon={resolveIcon(category.iconName)}
                  />
                ))}
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
  return (
    <section className="border-b border-white/10">
      <div className="mx-auto grid max-w-[1440px] items-stretch gap-8 px-6 py-12 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:gap-12 lg:px-12 lg:py-14">
        <div className="flex flex-col justify-center">
          <p className="text-brass mb-5 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] uppercase">
            <AppLink
              href="/shop"
              className="hover:text-canvas transition-colors"
            >
              Shop
            </AppLink>
            {category && room ? (
              <>
                <span aria-hidden className="text-brass/50">
                  /
                </span>
                <AppLink
                  href={shopHref}
                  className="hover:text-canvas transition-colors"
                >
                  {room.name}
                </AppLink>
              </>
            ) : null}
            <span aria-hidden className="text-brass/50">
              /
            </span>
            <span>{crumb}</span>
          </p>
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
        </div>

        <div className="relative min-h-[220px] overflow-hidden rounded-xl lg:min-h-0">
          <Image
            src={category?.image ?? room?.image ?? "/images/garden-after.jpg"}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
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
}: {
  categories: SanityCategory[];
  totalProducts: number;
  activeSlug?: string;
  allHref: string;
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

function GardenStudioCard() {
  return (
    <div className="bg-basalt-raise rounded-xl border border-white/8 p-5">
      <p className="text-brass mb-2 text-[11px] font-semibold tracking-[0.18em] uppercase">
        Garden Studio
      </p>
      <p className="text-canvas font-display text-[22px] leading-tight">
        Visualise it in your space
      </p>
      <p className="text-canvas/55 mt-3 text-[13px] leading-relaxed">
        Upload a photo of your garden and see our products in your space
        instantly.
      </p>
      <AppLink
        href="/guided-buying"
        className="border-brass/50 text-brass hover:bg-brass mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md border text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:text-white"
      >
        Try Garden Studio <span aria-hidden>→</span>
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

function CategoryTile({
  category,
  icon: Icon,
}: {
  category: SanityCategory;
  icon: LucideIcon;
}) {
  return (
    <AppLink
      href={`/shop/${category.slug}`}
      className="group hover:border-brass/40 relative block aspect-[4/3] overflow-hidden rounded-xl border border-white/8 transition-colors"
    >
      {category.image ? (
        <Image
          src={category.image}
          alt={category.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 22vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        />
      ) : (
        <div className="from-basalt-card to-basalt absolute inset-0 flex items-center justify-center bg-gradient-to-br">
          <Icon
            className="text-brass/60 size-8"
            strokeWidth={1.2}
            aria-hidden
          />
        </div>
      )}
      <div className="from-basalt/95 via-basalt/20 absolute inset-0 bg-gradient-to-t to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-canvas font-display text-[18px] leading-tight">
          {category.name}
        </p>
        <p className="text-brass mt-1 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.1em] uppercase">
          {category.productCount} Products <span aria-hidden>→</span>
        </p>
      </div>
    </AppLink>
  );
}

function ProductTile({ product }: { product: SanityProduct }) {
  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group hover:border-brass/40 relative block overflow-hidden rounded-xl border border-white/8 transition-colors"
    >
      <div className="relative aspect-[4/5]">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 50vw, 30vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="from-basalt-card to-basalt absolute inset-0 bg-gradient-to-br" />
        )}
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
        We&rsquo;re curating this collection now. In the meantime, our team can
        source and specify pieces for you directly.
      </p>
      <AppLink
        href="/guided-buying"
        className="border-brass/50 text-brass hover:bg-brass mt-6 flex h-11 items-center gap-2 rounded-md border px-6 text-[11px] font-semibold tracking-[0.14em] uppercase transition-colors hover:text-white"
      >
        Speak to our team <span aria-hidden>→</span>
      </AppLink>
    </div>
  );
}
