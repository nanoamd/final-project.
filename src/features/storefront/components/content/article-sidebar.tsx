import { AppLink } from "@/components/ui/app-link";
import { ALL_TOOLS, toolsForCategory } from "@/lib/content/tools";
import type { ArticleSidebarData, SidebarLink } from "@/lib/sanity/queries";

/**
 * The rail of related links down the left of a guide or journal post.
 *
 * Damien: _"the blogs should have more links on the left side of the page,
 * like a dropdown list of related stuff for buying guides tools, comparisons
 * blogs etc, they should all be highlighted orange"_.
 *
 * Built on `<details>` and `<summary>` rather than a React accordion. They open
 * and close with no JavaScript, keyboard support and screen-reader semantics
 * come free, and — the part that matters for why this exists at all — the links
 * inside a closed `<details>` are still in the HTML, so a crawler follows them
 * whether or not anyone clicks. An accordion that mounts its contents on click
 * would put the whole point of the sidebar behind an interaction.
 *
 * Open by default on the two groups most likely to be wanted, closed on the
 * rest, so the rail is useful at a glance without becoming a wall.
 */

function toolsFor(categorySlug?: string | null): SidebarLink[] {
  const matched = toolsForCategory(categorySlug);
  // Every article gets a route into the tools even when its category has no
  // obvious calculator — an empty group would just be a heading.
  return matched.length ? matched : ALL_TOOLS.slice(0, 4);
}

function Group({
  heading,
  links,
  open,
}: {
  heading: string;
  links: SidebarLink[];
  open?: boolean;
}) {
  if (!links.length) return null;
  return (
    <details open={open} className="border-line border-b pb-4 last:border-b-0">
      <summary className="text-ink hover:text-brass marker:text-brass cursor-pointer list-disc py-2 text-[12px] font-medium tracking-[0.14em] uppercase transition-colors">
        {heading}
      </summary>
      <ul className="mt-2 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <AppLink
              href={link.href}
              className="text-brass hover:text-brass-deep text-[14px] leading-snug underline-offset-2 transition-colors hover:underline"
            >
              {link.title}
            </AppLink>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function ArticleSidebar({
  sidebar,
  categorySlug,
  categoryName,
}: {
  sidebar: ArticleSidebarData;
  categorySlug?: string | null;
  categoryName?: string | null;
}) {
  const tools = toolsFor(categorySlug);
  const shop: SidebarLink[] = categorySlug
    ? [
        {
          title: `Shop ${categoryName ?? categorySlug}`,
          href: `/shop/${categorySlug}`,
        },
        { title: "All buying guides", href: "/learn" },
        { title: "All planning tools", href: "/tools" },
      ]
    : [
        { title: "All buying guides", href: "/learn" },
        { title: "All planning tools", href: "/tools" },
        { title: "Shop everything", href: "/shop" },
      ];

  return (
    <aside className="flex flex-col gap-1" aria-label="Related reading">
      <Group
        heading={categoryName ? `More on ${categoryName}` : "Buying guides"}
        links={sidebar.sameCategory}
        open
      />
      <Group heading="Related guides" links={sidebar.relatedGuides} open />
      <Group heading="Calculators" links={tools} />
      <Group heading="From the journal" links={sidebar.journal} />
      <Group heading="Shop" links={shop} />
    </aside>
  );
}
