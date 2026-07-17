import type { Metadata } from "next";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { GardenVisualiserTool } from "@/features/garden-visualiser";
import {
  getCategories,
  getDepartments,
  getProductsByCategory,
} from "@/lib/sanity/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "AI Design Studio",
  description:
    "Upload a photo of your own space, add real products from Kaiku, and see it redesigned in seconds.",
};

export default async function GardenVisualiserPage() {
  const [departments, categories] = await Promise.all([
    getDepartments(),
    getCategories(),
  ]);

  const categoriesWithProducts = await Promise.all(
    categories
      .filter((c) => c.productCount > 0)
      .map(async (c) => ({
        slug: c.slug,
        name: c.name,
        departmentSlug: c.departmentSlug ?? "outdoor-living",
        products: await getProductsByCategory(c.slug),
      })),
  );

  return (
    <div className="bg-basalt">
      <section className="border-b border-white/10">
        <Container className="py-16 text-center sm:py-20 lg:py-24">
          <Eyebrow className="text-brass">The Design Studio</Eyebrow>
          <h1 className="text-canvas font-display mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
            See your own space, redesigned
          </h1>
          <p className="text-canvas/65 mx-auto mt-5 max-w-lg text-[15px] leading-relaxed sm:text-base">
            Choose a room, add real products from Kaiku — or let us choose for
            you — then upload a photo of your own space and watch it come to
            life.
          </p>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <GardenVisualiserTool
          departments={departments}
          categories={categoriesWithProducts}
        />
      </Container>
    </div>
  );
}
