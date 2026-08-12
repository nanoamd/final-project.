import { expect, test } from "@playwright/test";

/**
 * The homepage renders, and renders the real site rather than an empty shell.
 *
 * This file used to assert `toHaveTitle("Create Next App")` — the Next.js
 * scaffold's default, never updated after the storefront was built. It has been
 * failing every CI run since 15 July, alongside `prettier --check`, which is why
 * no automated check had passed on the deployed branch for a month.
 *
 * Asserting on the title alone would have been the small fix. It is not enough:
 * `sanityFetch` is deliberately fail-soft, so a site that cannot reach Sanity
 * still returns 200 with the correct title and no content at all. That exact
 * failure has happened in production. So the second test checks that real
 * catalogue data arrived, which is the thing a smoke test is for.
 */
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Kaiku/);
});

test("home page renders real catalogue content, not an empty shell", async ({
  page,
}) => {
  await page.goto("/");

  // The category rail is built from Sanity. If content did not load it renders
  // nothing, so this heading is the cheapest proof the query returned rows.
  await expect(
    page.getByRole("heading", { name: /browse every collection/i }),
  ).toBeVisible();

  // At least one link into a category page. Matched by href rather than by text,
  // so renaming a category does not break the smoke test.
  await expect(page.locator('a[href^="/shop/"]').first()).toBeVisible();
});
