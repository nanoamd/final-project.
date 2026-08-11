/**
 * Lists newsletter signups and contact-form messages.
 *
 * Both land in Sanity as documents (newsletterSubscriber, contactSubmission) and
 * both are visible in Studio and in /admin — but "has anyone signed up or tried
 * contacting me?" is a question worth being able to answer in one command rather
 * than clicking through two screens.
 *
 * Read-only. Needs a token because contact messages are private: a tokenless read
 * would only see what the public API exposes, and would also miss drafts.
 *
 *   pnpm tsx --env-file=.env.local scripts/check-signups.ts
 */
import { createClient } from "@sanity/client";

const token = process.env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error("SANITY_API_WRITE_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "huh1e45n",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  token,
  useCdn: false,
});

interface Subscriber {
  _id: string;
  _createdAt: string;
  email: string | null;
  subscribedAt: string | null;
}

interface Submission {
  _id: string;
  _createdAt: string;
  name: string | null;
  email: string | null;
  message: string | null;
  submittedAt: string | null;
}

/** The recorded timestamp, or the document's own if the form did not set one. */
const when = (recorded: string | null, created: string) =>
  (recorded ?? created).slice(0, 16).replace("T", " ");

async function main() {
  const [subscribers, submissions] = await Promise.all([
    client.fetch<Subscriber[]>(
      `*[_type == "newsletterSubscriber"]|order(_createdAt desc){_id, _createdAt, email, subscribedAt}`,
    ),
    client.fetch<Submission[]>(
      `*[_type == "contactSubmission"]|order(_createdAt desc){_id, _createdAt, name, email, message, submittedAt}`,
    ),
  ]);

  console.log(`\nNewsletter subscribers: ${subscribers.length}`);
  for (const s of subscribers)
    console.log(`  ${when(s.subscribedAt, s._createdAt)}  ${s.email ?? "—"}`);
  if (!subscribers.length) console.log("  (none)");

  console.log(`\nContact messages: ${submissions.length}`);
  for (const m of submissions) {
    console.log(
      `  ${when(m.submittedAt, m._createdAt)}  ${m.name ?? "—"} <${m.email ?? "—"}>`,
    );
    for (const line of String(m.message ?? "").split("\n"))
      if (line.trim()) console.log(`      ${line.trim()}`);
  }
  if (!submissions.length) console.log("  (none)");
  console.log("");
}

main().catch((err) => {
  console.error("check-signups failed:", err);
  process.exit(1);
});
