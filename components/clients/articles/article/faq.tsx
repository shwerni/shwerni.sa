// components
import { serverIcon } from "@/components/shared/server-icon";

// icons: a plain server svg (no client component)
import { __iconNode as chevronDownNode } from "lucide-react/dist/esm/icons/chevron-down.mjs";
const ChevronDown = serverIcon("chevron-down", chevronDownNode);

export type ArticleFaqItem = { question: string; answer: string };

// props
interface Props {
  aid: number;
  faqs: ArticleFaqItem[];
}

// the article's faq section, under the body: one native <details> per question, all closed.
// no client js, and the full question and answer text is in the html. the page's FAQPage
// json-ld renders the same list. renders nothing when the article has no faqs
export function ArticleFaq({ aid, faqs }: Props) {
  if (!faqs.length) return null;

  const headingId = `article-faq-${aid}`;

  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-theme-700 text-[1.375rem] font-semibold">
        الأسئلة الشائعة
      </h2>
      <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
        {faqs.map((faq, index) => (
          <details key={index} className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <h3 className="text-theme-700 text-[1.05rem] font-semibold leading-7">
                {faq.question}
              </h3>
              <ChevronDown className="size-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 pt-2 font-medium leading-7 text-gray-800">
              {faq.answer
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
