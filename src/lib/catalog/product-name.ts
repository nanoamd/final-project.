import { siteConfig } from "@/config/site";

/**
 * The product name as a human should read it, with the brand suffix removed.
 *
 * Almost every product title in Sanity ends in the brand — "13.6m Warm White
 * Decorative LED String Lights | Kaiku" — because the titles were written to be
 * `<title>` tags. `src/lib/seo/metadata.ts` already handles that end of it: it
 * detects an already-branded title and switches to `title.absolute` so the page
 * title is not "… | Kaiku — Kaiku".
 *
 * Nothing handled the *page*. The `<h1>` on every product page read "13.6m Warm
 * White Decorative LED String Lights | Kaiku", the Reviews panel said "The 13.6m
 * Warm White Decorative LED String Lights | Kaiku is newly listed", and the
 * Product structured data gave Google the same string as the product's name. A
 * shopper deciding whether a four-month-old shop is real does not need to be shown
 * the seams of its CMS.
 *
 * Deliberately conservative. It strips a *trailing* segment only, and only when that
 * segment is the brand — "Ashcombe Bench | Set of 2" keeps its pipe, because that
 * pipe is doing work. Looping handles the double suffix a copy-paste leaves behind.
 */
export function productDisplayName(title: string): string {
  const brand = siteConfig.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Pipe, hyphen, en dash or em dash, then the brand, optionally "Home".
  const suffix = new RegExp(`\\s*[|\\-–—]\\s*${brand}(\\s+Home)?\\s*$`, "i");

  let name = title.trim();
  while (suffix.test(name)) {
    const stripped = name.replace(suffix, "").trim();
    // Never return an empty string: a product genuinely titled "Kaiku" keeps its
    // name rather than losing it, because a blank <h1> is worse than a clumsy one.
    if (!stripped) break;
    name = stripped;
  }
  return name;
}
