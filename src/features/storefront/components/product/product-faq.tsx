import { ChevronDown } from "lucide-react";

import type { ProductFaq } from "@/types/catalog";

export function ProductFaqs({ faqs }: { faqs: ProductFaq[] }) {
  return (
    <div className="border-line border-t">
      {faqs.map((faq) => (
        <details key={faq.question} className="group border-line border-b">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <span className="text-ink text-lg font-medium">{faq.question}</span>
            <ChevronDown
              className="text-muted size-5 shrink-0 transition-transform duration-300 group-open:rotate-180"
              strokeWidth={1.6}
            />
          </summary>
          <p className="text-muted max-w-2xl pb-6 leading-relaxed">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
