import type { Metadata } from "next";

import { ComingSoon } from "@/components/shared/coming-soon";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { getFaqs } from "@/lib/sanity/queries";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Answers to common questions about delivery, returns and our products.",
};

export default async function FaqPage() {
  const faqs = await getFaqs();

  if (!faqs.length) {
    return (
      <ComingSoon
        eyebrow="FAQ"
        title="Frequently asked questions"
        intro="Our FAQ page is being put together — in the meantime, get in touch and we'll answer directly."
      />
    );
  }

  const topics = Array.from(new Set(faqs.map((f) => f.topic)));

  return (
    <Container className="py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <Eyebrow>FAQ</Eyebrow>
        <h1 className="font-display text-ink mt-3 text-4xl leading-[1.05] tracking-tight text-balance sm:text-5xl">
          Frequently asked questions
        </h1>

        <div className="mt-12 flex flex-col gap-10">
          {topics.map((topic) => (
            <div key={topic}>
              <h2 className="text-ink font-display mb-4 text-xl tracking-tight">
                {topic}
              </h2>
              <dl className="border-line divide-line divide-y border-t">
                {faqs
                  .filter((f) => f.topic === topic)
                  .map((faq) => (
                    <div key={faq.question} className="py-5">
                      <dt className="text-ink text-[15px] font-medium">{faq.question}</dt>
                      <dd className="text-graphite mt-2 text-[14px] leading-relaxed">
                        {faq.answer}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
