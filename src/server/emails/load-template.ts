import "server-only";

import { createClient } from "@sanity/client";

import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from "@/lib/sanity/config";

import type { EmailTemplateDoc } from "./template-renderer";

/**
 * Its own client, with the CDN off.
 *
 * `sanityClient` runs `useCdn: true`, which is right for the storefront and
 * wrong here: an editor who fixes a typo and sends a test needs to see the fix,
 * not an edge-cached copy of the previous version. One uncached read per email
 * sent is a negligible cost.
 */
const emailClient = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
});

/**
 * Fetches the editor-authored version of one email, or `null` when there isn't
 * one to use.
 *
 * `null` is the normal, expected answer — most emails will not have a template
 * until Damien makes one — and every caller reads it as "send the built-in
 * version". A failed fetch returns `null` for the same reason: Sanity being
 * briefly unreachable must not stop an order confirmation going out.
 *
 * `imageUrl` is resolved here rather than in the renderer so the renderer stays
 * a pure function over plain data, and so the email carries an absolute CDN URL
 * — the only kind that works in a mail client.
 */
export async function loadEmailTemplate(
  key: string,
): Promise<EmailTemplateDoc | null> {
  try {
    return await emailClient.fetch<EmailTemplateDoc | null>(
      `*[_type == "emailTemplate" && key == $key && enabled == true && !(_id in path("drafts.**"))]
        | order(_updatedAt desc)[0]{
          key, enabled, subject, preheader,
          blocks[]{
            _type, _key, text, eyebrow, small, alt, width, href, label, height,
            "imageUrl": asset.asset->url
          }
        }`,
      { key },
    );
  } catch (error) {
    console.error(`[email] could not load template "${key}"`, error);
    return null;
  }
}
