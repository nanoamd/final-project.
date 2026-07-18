import Image from "next/image";

import { PromoBanner } from "@/components/shared/promo-banner";
import { AppLink } from "@/components/ui/app-link";
import { formatPrice } from "@/lib/format";
import { getDepartments, getProductsByDepartment } from "@/lib/sanity/queries";
import type { SanityProduct } from "@/types/sanity-content";

/**
 * Shop All — the white, commercial-browsing counterpart to the black room
 * pages. Every product in a room, one dense grid, no sidebar or category
 * filters (customers who want those go back to the room page). Distinct from
 * the room page's editorial black ground on purpose — the contrast signals
 * "you've moved from inspiration to buying."
 */
export async function ShopAll({ roomSlug }: { roomSlug: string }) {
  const [rooms, products] = await Promise.all([
    getDepartments(),
    getProductsByDepartment(roomSlug),
  ]);
  const room = rooms.find((r) => r.slug === roomSlug);

  return (
    <div className="bg-canvas text-ink min-h-screen">
      <PromoBanner>
        Get 10% OFF your first order. Join the Kaiku Home newsletter.
      </PromoBanner>

      <div className="border-line border-b">
        <div className="mx-auto flex max-w-[1480px] [scrollbar-width:none] items-center gap-7 overflow-x-auto px-6 py-4 sm:px-8 lg:px-12">
          {rooms.map((r) => (
            <AppLink
              key={r.slug}
              href={`/shop/room/${r.slug}/all`}
              className={
                r.slug === roomSlug
                  ? "text-brass shrink-0 text-[13px] font-semibold tracking-[0.08em] whitespace-nowrap uppercase"
                  : "text-muted hover:text-ink shrink-0 text-[13px] font-medium tracking-[0.08em] whitespace-nowrap uppercase transition-colors"
              }
            >
              {r.name}
            </AppLink>
          ))}
        </div>
      </div>

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
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 18vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
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
