import "server-only";

import { sanityClient } from "@/lib/sanity/client";
import { getAuthorizedAdmin } from "@/server/auth/admin";

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  submittedAt: string;
}

export interface NewsletterSubscriberRow {
  id: string;
  email: string;
  subscribedAt: string;
}

const SUBMISSIONS_QUERY = /* groq */ `
*[_type == "contactSubmission"] | order(submittedAt desc) [0...200] {
  "id": _id, name, email, message, submittedAt
}`;

const SUBSCRIBERS_QUERY = /* groq */ `
*[_type == "newsletterSubscriber"] | order(subscribedAt desc) [0...1000] {
  "id": _id, email, subscribedAt
}`;

/** Contact form submissions, newest first — the admin Inbox's data source.
 * Submissions live in Sanity (written by submitContactForm); this reads them
 * with the same fail-soft contract as every other query: errors return []. */
export async function listContactSubmissions(): Promise<ContactSubmission[]> {
  if (!(await getAuthorizedAdmin())) return [];
  try {
    return await sanityClient.fetch<ContactSubmission[]>(
      SUBMISSIONS_QUERY,
      {},
      { useCdn: false },
    );
  } catch (err) {
    console.error("listContactSubmissions: failed", err);
    return [];
  }
}

export interface SubscriberSummary {
  subscribers: NewsletterSubscriberRow[];
  newThisWeek: number;
}

export async function listNewsletterSubscribers(): Promise<SubscriberSummary> {
  if (!(await getAuthorizedAdmin())) return { subscribers: [], newThisWeek: 0 };
  try {
    const subscribers = await sanityClient.fetch<NewsletterSubscriberRow[]>(
      SUBSCRIBERS_QUERY,
      {},
      { useCdn: false },
    );
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return {
      subscribers,
      newThisWeek: subscribers.filter(
        (s) => new Date(s.subscribedAt).getTime() > weekAgo,
      ).length,
    };
  } catch (err) {
    console.error("listNewsletterSubscribers: failed", err);
    return { subscribers: [], newThisWeek: 0 };
  }
}
