import { createClient } from "@sanity/client";

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const ref = (id) => ({ _type: "reference", _ref: id });

// Placeholder categories for departments with no real products yet — gives
// the mega menu real content to show instead of empty columns. Same
// createOrReplace pattern as scripts/seed-sanity.ts (safe to re-run).
const CATEGORIES = [
  // Living Room
  {
    slug: "coffee-tables",
    title: "Coffee Tables",
    department: "department-living-room",
  },
  {
    slug: "side-tables",
    title: "Side Tables",
    department: "department-living-room",
  },
  {
    slug: "living-room-storage",
    title: "Storage",
    department: "department-living-room",
  },
  { slug: "shelving", title: "Shelving", department: "department-living-room" },
  {
    slug: "living-room-lighting",
    title: "Lighting",
    department: "department-living-room",
  },
  { slug: "rugs", title: "Rugs", department: "department-living-room" },
  // Bedroom
  {
    slug: "bedside-tables",
    title: "Bedside Tables",
    department: "department-bedroom",
  },
  {
    slug: "bedroom-storage",
    title: "Storage",
    department: "department-bedroom",
  },
  {
    slug: "bedroom-lighting",
    title: "Lighting",
    department: "department-bedroom",
  },
  {
    slug: "bedroom-mirrors",
    title: "Mirrors",
    department: "department-bedroom",
  },
  // Kitchen
  {
    slug: "kitchen-shelving",
    title: "Shelving",
    department: "department-kitchen",
  },
  {
    slug: "kitchen-storage",
    title: "Storage",
    department: "department-kitchen",
  },
  {
    slug: "kitchen-furniture",
    title: "Furniture",
    department: "department-kitchen",
  },
  {
    slug: "kitchen-lighting",
    title: "Lighting",
    department: "department-kitchen",
  },
  // Bathroom
  {
    slug: "bathroom-mirrors",
    title: "Mirrors",
    department: "department-bathroom",
  },
  {
    slug: "bathroom-storage",
    title: "Storage",
    department: "department-bathroom",
  },
  {
    slug: "bathroom-accessories",
    title: "Accessories",
    department: "department-bathroom",
  },
  {
    slug: "towel-rails",
    title: "Towel Rails",
    department: "department-bathroom",
  },
  {
    slug: "bathroom-lighting",
    title: "Lighting",
    department: "department-bathroom",
  },
  // Home Office
  { slug: "desks", title: "Desks", department: "department-office" },
  { slug: "office-storage", title: "Storage", department: "department-office" },
  {
    slug: "office-lighting",
    title: "Lighting",
    department: "department-office",
  },
  {
    slug: "office-shelving",
    title: "Shelving",
    department: "department-office",
  },
];

async function main() {
  for (const [i, c] of CATEGORIES.entries()) {
    await client.createOrReplace({
      _id: `category-${c.slug}`,
      _type: "category",
      title: c.title,
      slug: { _type: "slug", current: c.slug },
      department: ref(c.department),
      iconName: "leaf",
      order: i,
    });
    console.log(`  ${c.title} (${c.department})`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
