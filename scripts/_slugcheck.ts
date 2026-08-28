import { createClient } from "@sanity/client";
const c = createClient({
  projectId: "huh1e45n",
  dataset: "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});
async function main() {
  const g = await c.fetch(
    `*[_type=="buyingGuide" && defined(publishedAt)]{"slug":slug.current,title}`,
  );
  for (const x of g) console.log(`${x.slug}  ::  ${x.title}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
