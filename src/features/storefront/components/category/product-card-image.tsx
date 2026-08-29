"use client";

import Image from "next/image";
import * as React from "react";

/**
 * A product card's photograph, with its hover swap loaded only on hover.
 *
 * **Why the hover image is not simply rendered.** Every tile carried two
 * `<Image>` elements — the catalogue shot and the setting shot underneath it at
 * `opacity-0`. The browser downloads both, so half the image bytes on a shop
 * page were spent on a photograph most visitors never see and no phone can
 * ever trigger, since touch has no hover. On a 58-product category page that is
 * 58 wasted downloads.
 *
 * Mounting the hover image on `mouseenter` costs one short load the first time
 * a pointer crosses a tile, and nothing at all on a phone.
 *
 * **Why `object-contain`.** The tile is square and 32 live products are not:
 * their photographs run from 2.45:1 down to 0.47:1, and `object-cover` was
 * cutting 59% off the widest of them — a coffee table shown as a strip of its
 * own middle. The card sits on `--color-paper`, which is pure white, and these
 * are catalogue shots on white, so containing the photo letterboxes it into
 * white on white and nothing shows but the whole product.
 */
export function ProductCardImage({
  src,
  hoverSrc,
  alt,
  sizes,
}: {
  src: string;
  hoverSrc?: string | null;
  alt: string;
  sizes: string;
}) {
  const [showHover, setShowHover] = React.useState(false);

  return (
    <span
      className="absolute inset-0"
      onMouseEnter={hoverSrc ? () => setShowHover(true) : undefined}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className="object-contain transition-transform duration-700 group-hover:scale-[1.04]"
      />
      {hoverSrc && showHover ? (
        <Image
          src={hoverSrc}
          alt=""
          fill
          sizes={sizes}
          className="absolute inset-0 object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      ) : null}
    </span>
  );
}
