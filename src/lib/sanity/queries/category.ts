import { sanityFetch } from "@/lib/sanity/fetch";
import type { SanityCategory } from "@/types/sanity-content";

const CATEGORY_PROJECTION = /* groq */ `{
  "slug": slug.current,
  "name": title,
  tagline,
  description,
  "departmentSlug": department->slug.current,
  "departmentName": department->title,
  // Every room this category is shoppable from, primary first. Wellness
  // Accessories belongs under Sauna and under Outdoor Living, and the department
  // field is a single reference, so this list is what consumers should filter on.
  "departmentSlugs": array::compact([
    department->slug.current,
    ...additionalDepartments[]->slug.current
  ]),
  excludeFromRoomGrid,
  iconName,
  comingSoon,
  "productCount": count(*[_type == "product" && references(^._id)]),
  "image": heroImage.asset->url,
  intro,
  buyingGuide,
  "faqs": faqs[]{ question, answer },
  // Only related categories that actually hold products — a link to an empty page
  // spends a shopper's click on nothing and passes equity into a dead end.
  //
  // The stocked test is projected as a boolean rather than applied as a trailing
  // filter on the projection. That filter form does not remove non-matching entries
  // here, it leaves nulls in the array, and a null reached .map() in the category
  // page and broke the production build. Consumers still guard, but the query
  // should not be handing them holes.
  //
  // No backticks in these comments: the whole query is a JS template literal, so a
  // backtick ends the string and the file stops parsing.
  "relatedCategories": relatedCategories[]->{
    "slug": slug.current, "name": title, description,
    "stocked": count(*[_type == "product" && !(_id in path("drafts.**")) && references(^._id)]) > 0
  }
}`;

const CATEGORIES_QUERY = /* groq */ `
*[_type == "category"] | order(order asc) ${CATEGORY_PROJECTION}`;

const CATEGORY_BY_SLUG_QUERY = /* groq */ `
*[_type == "category" && slug.current == $slug][0] ${CATEGORY_PROJECTION}`;

export async function getCategories(): Promise<SanityCategory[]> {
  return sanityFetch<SanityCategory[]>(CATEGORIES_QUERY, {}, []);
}

export async function getCategory(
  slug: string,
): Promise<SanityCategory | null> {
  return sanityFetch<SanityCategory | null>(
    CATEGORY_BY_SLUG_QUERY,
    { slug },
    null,
  );
}
