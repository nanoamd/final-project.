import Link from "next/link";
import type { useRouter } from "next/navigation";
import * as React from "react";

type LinkProps = React.ComponentProps<typeof Link>;
type RouterHref = Parameters<ReturnType<typeof useRouter>["push"]>[0];

/**
 * The two casts that reconcile `typedRoutes` with hrefs we only know at runtime
 * — from config, from Sanity, or from a sanitised `?next=` parameter. `Link` and
 * `router.push` want different route types, so there are two, but they live here
 * together rather than being rediscovered at every call site.
 */
export function toRoute(href: string): LinkProps["href"] {
  return href as LinkProps["href"];
}

/** As `toRoute`, for `router.push` and `router.replace`. */
export function toRouterHref(href: string): RouterHref {
  return href as RouterHref;
}

/**
 * Link wrapper that accepts plain `string` hrefs sourced from config and data,
 * while we keep `typedRoutes` enabled for the statically-known links we author
 * by hand. Centralises the one necessary cast in a single place.
 */
export function AppLink({
  href,
  ...props
}: Omit<LinkProps, "href"> & { href: string }) {
  return <Link href={toRoute(href)} {...props} />;
}
