import { AppLink } from "@/components/ui/app-link";
import { TOOL_GROUPS } from "@/lib/content/tools";
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

/** Tools whose calculator answers the question a category's guides ask. */
const TOOLS_BY_CATEGORY: Record<string, string[]> = {
  planters: ["/tools/planter-size-calculator"],
  vases: ["/tools/vase-size-calculator"],
  mirrors: ["/tools/mirror-size-calculator"],
  "bedroom-mirrors": ["/tools/mirror-size-calculator"],
  "bathroom-mirrors": ["/tools/mirror-size-calculator"],
  lighting: [
    "/tools/pendant-light-size-calculator",
    "/tools/wall-art-size-calculator",
  ],
  "kitchen-lighting": ["/tools/pendant-light-size-calculator"],
  "garden-lighting": ["/tools/pendant-light-size-calculator"],
  beds: ["/tools/bed-size-calculator"],
  sofas: ["/tools/sofa-size-calculator"],
  "tv-units": ["/tools/tv-unit-size-calculator"],
  "wall-art": ["/tools/wall-art-size-calculator"],
  "wall-clocks": ["/tools/wall-clock-size-calculator"],
  "kitchen-furniture": ["/tools/dining-table-size-calculator"],
  "coffee-tables": [
    "/tools/coffee-table-size-calculator",
    "/tools/sofa-size-calculator",
  ],
  "side-tables": ["/tools/coffee-table-size-calculator"],
  "garden-furniture": [
    "/tools/dining-set-size-calculator",
    "/tools/garden-furniture-material-selector",
  ],
  "fire-pits": ["/tools/patio-heater-size-calculator"],
  pergolas: ["/tools/garden-visualiser"],
  "outdoor-saunas": ["/tools/sauna-size-calculator"],
  "indoor-saunas": ["/tools/sauna-size-calculator"],
  "cold-plunges": [
    "/tools/cold-plunge-size-calculator",
    "/tools/contrast-therapy-planner",
  ],
};

/**
 * Flattened to plain links up front.
 *
 * `TOOL_GROUPS` is `as const`, so each group's `tools` is a tuple of literal
 * types rather than an array of a shared shape — useful where the registry is
 * rendered, useless for looking a tool up by href, and enough to make a
 * `.find()` over the union fail to typecheck. Widening once here is clearer
 * than casting at every use.
 */
const ALL_TOOLS: SidebarLink[] = TOOL_GROUPS.flatMap((group) =>
  group.tools.map((tool) => ({ title: tool.title, href: tool.href })),
);

function toolsFor(categorySlug?: string | null): SidebarLink[] {
  const wanted = categorySlug ? (TOOLS_BY_CATEGORY[categorySlug] ?? []) : [];
  const matched = wanted
    .map((href) => ALL_TOOLS.find((tool) => tool.href === href))
    .filter((tool): tool is SidebarLink => Boolean(tool));
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
