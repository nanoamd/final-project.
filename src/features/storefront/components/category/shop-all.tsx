import Image from "next/image";

import { PromoBanner } from "@/components/shared/promo-banner";
import { ShopDrillNav } from "@/components/shared/shop-drill-nav";
import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import {
  getCategories,
  getDepartments,
  getProductsByDepartment,
} from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Shop All — the white, commercial-browsing counterpart to the black room
 * pages. Every product in a room, one dense grid, no sidebar. Distinct from
 * the room page's editorial black ground on purpose — the contrast signals
 * "you've moved from inspiration to buying." The room/category/style
 * drill-nav stays on this page when switching rooms (links to the `/all`
 * route, not the dark room page).
 */
export async function ShopAll({ roomSlug }: { roomSlug: string }) {
  const [rooms, categories, products] = await Promise.all([
    getDepartments(),
    getCategories(),
    getProductsByDepartment(roomSlug),
  ]);
  const room = rooms.find((r) => r.slug === roomSlug);

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <PromoBanner>
        Get 10% OFF your first order. Join the Kaiku Home newsletter.
      </PromoBanner>

      <ShopDrillNav
        rooms={rooms}
        categories={categories}
        theme="light"
        roomHrefSuffix="/all"
      />

      <div className="mx-auto max-w-[1480px] px-6 py-10 sm:px-8 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h1 className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
            {room?.name ?? "Shop All"}
          </h1>
          <p className="text-muted shrink-0 text-[13px]">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </div>

        {products.length ? (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
            {products.map((product) => (
              <ShopAllTile key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="border-line flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-24 text-center">
            <p className="font-display text-2xl">
              {room?.name ?? "This room"} — coming soon
            </p>
            <p className="text-muted mt-3 max-w-sm text-[14px] leading-relaxed">
              We&rsquo;re curating this room&rsquo;s catalogue now — check back
              soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ShopAllTile({ product }: { product: SanityProduct }) {
  return (
    <AppLink
      href={`/shop/${product.category}/${product.slug}`}
      className="group block"
    >
      <div className="border-line bg-paper relative aspect-square overflow-hidden rounded-lg border">
        {(product.cardImage ?? product.image) ? (
          <Image
            src={product.cardImage ?? product.image!}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : null}
        {product.studioImage ? (
          <Image
            src={product.studioImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
            className="absolute inset-0 object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}
      </div>
      <p className="text-ink group-hover:text-brass mt-3 text-[14px] leading-snug font-medium transition-colors">
        {product.name}
      </p>
      <p className="text-muted mt-1 text-[13px]">
        From {formatPrice(product.price)}
      </p>
    </AppLink>
  );
}
