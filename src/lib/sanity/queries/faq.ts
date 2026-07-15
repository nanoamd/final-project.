import { sanityFetch } from "@/lib/sanity/fetch";
import type { SanityFaq } from "@/types/sanity-content";

const FAQS_QUERY = /* groq */ `
*[_type == "faq"] | order(topic asc, order asc) {
  question,
  answer,
  topic
}`;

export async function getFaqs(): Promise<SanityFaq[]> {
  return sanityFetch<SanityFaq[]>(FAQS_QUERY, {}, []);
}
