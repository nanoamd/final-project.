/**
 * Real, working tools per department, beyond the AI Garden Visualiser
 * (handled separately via GARDEN_VISUALISER_DEPARTMENT_SLUGS since it takes
 * a product param). Shown alongside — and ahead of — the "coming soon"
 * placeholders in the product page's Tools column.
 */
export const REAL_TOOLS_BY_DEPARTMENT: Record<
  string,
  { title: string; href: string }[]
> = {
  "outdoor-living": [
    {
      title: "Garden Furniture Material & Weather Resilience Selector",
      href: "/tools/garden-furniture-material-selector",
    },
  ],
  sauna: [
    {
      title: "Sauna Size & Capacity Calculator",
      href: "/tools/sauna-size-calculator",
    },
    {
      title: "Contrast Therapy Protocol Builder",
      href: "/tools/contrast-therapy-planner",
    },
  ],
  "cold-plunge": [
    {
      title: "Cold Plunge Size & Capacity Calculator",
      href: "/tools/cold-plunge-size-calculator",
    },
    {
      title: "Contrast Therapy Protocol Builder",
      href: "/tools/contrast-therapy-planner",
    },
  ],
};
