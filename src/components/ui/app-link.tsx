import Link from "next/link";
import * as React from "react";

type LinkProps = React.ComponentProps<typeof Link>;

/**
 * Link wrapper that accepts plain `string` hrefs sourced from config and data,
 * while we keep `typedRoutes` enabled for the statically-known links we author
 * by hand. Centralises the one necessary cast in a single place.
 */
export function AppLink({
  href,
  ...props
}: Omit<LinkProps, "href"> & { href: string }) {
  return <Link href={href as LinkProps["href"]} {...props} />;
}
