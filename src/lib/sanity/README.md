# lib/sanity

Sanity content client and helpers (GROQ query client, image URL builder). Read
operations use the public client; authenticated/preview operations are driven
from `server/`.

- `client.ts` — public, CDN-cached read client.
- `image.ts` — `urlForImage()` builder (used for ad-hoc transforms; most
  queries resolve images to a plain URL directly in the GROQ projection).
- `fetch.ts` — `sanityFetch()`, the fail-soft wrapper every query function is
  built on. Never throws — a missing project ID, a network failure, or an
  empty dataset all resolve to the caller's fallback value instead of
  crashing. This matters most inside `generateStaticParams`, where an
  uncaught throw fails the entire `next build`, not just one route.
- `queries/` — one file per content type, each exporting typed async
  functions (`getProduct`, `getCategories`, `getHomepage`, …). Import from
  `queries/index.ts`.
