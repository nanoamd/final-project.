import type { PortableTextComponents } from "@portabletext/react";

import { portableTextComponents } from "@/lib/sanity/portable-text-components";

import { GuideToolEmbed } from "./guide-tool-embed";

/**
 * The site renderer, plus the block types only an article uses.
 *
 * `portableTextComponents` lives in `lib` and renders every product
 * description on the site. An embedded calculator is a component, and a
 * component reference does not belong in the shared library layer — nor does
 * every product page want the switch over eight calculators reachable from its
 * renderer. So the block type is registered here, where guides and journal
 * posts are rendered and nothing else is.
 */
export const articlePortableTextComponents: PortableTextComponents = {
  ...portableTextComponents,
  types: {
    ...portableTextComponents.types,
    /** A calculator, at the point in the guide that gives the rule it runs. */
    guideTool: ({ value }) =>
      value?.tool ? (
        <GuideToolEmbed tool={value.tool} caption={value.caption} />
      ) : null,
  },
};
