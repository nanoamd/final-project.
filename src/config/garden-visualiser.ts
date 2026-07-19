/**
 * Departments the garden visualiser can design for — shown grouped as
 * "outdoor" in the site's nav. Kept in sync with `DEPARTMENTS` in
 * scripts/seed-sanity.ts. Lives here (not inside the garden-visualiser
 * feature) so other features — e.g. the product page's "See it in your
 * garden" button — can reference it without crossing the feature/feature
 * architectural boundary.
 */
export const GARDEN_VISUALISER_DEPARTMENT_SLUGS = [
  "outdoor-living",
  "sauna",
  "cold-plunge",
  "outdoor-kitchen",
] as const;
