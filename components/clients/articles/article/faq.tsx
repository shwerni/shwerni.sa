// components
import { serverIcon } from "@/components/shared/server-icon";

// icons: plain server svgs (no client component)
import { __iconNode as plusNode } from "lucide-react/dist/esm/icons/plus.mjs";
import { __iconNode as questionNode } from "lucide-react/dist/esm/icons/message-circle-question-mark.mjs";
const Plus = serverIcon("plus", plusNode);
const QuestionIcon = serverIcon("message-circle-question-mark", questionNode);

export type ArticleFaqItem = { question: string; answer: string };

// props
interface Props {
  aid: number;
  faqs: ArticleFaqItem[];
}

// the article's faq section, under the body: one card per question, each a native <details>
// (all closed). the same name makes them an exclusive accordion (one open at a time) with no js;
// the full question and answer text is in the html. the open animation is css only (see
// .article-faq in styles/article.css). the page's FAQPage json-ld renders the same list.
// renders nothing when the article has no faqs
export function ArticleFaq({ aid, faqs }: Props) {
  if (!faqs.length) return null;

  const headingId = `article-faq-${aid}`;

  return (
    <section aria-labelledby={headingId} className="space-y-4">
      {/* heading */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-2">
          <QuestionIcon className="size-5 text-theme-700" />
          <h2 id={headingId} className="text-theme-700 text-[1.375rem] font-semibold">
            الأسئلة الشائعة
          </h2>
        </div>
        <p className="text-sm text-gray-500">إجابات مختصرة لأهم ما ورد في المقال</p>
      </div>

      {/* questions */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            name={headingId}
            className="article-faq group rounded-xl border border-gray-200 bg-white transition-colors duration-200 open:border-theme-200 open:bg-[rgb(245,248,255)] motion-reduce:transition-none"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3.5 outline-none transition-colors hover:bg-slate-50 group-open:hover:bg-transparent focus-visible:ring-2 focus-visible:ring-theme/50 [&::-webkit-details-marker]:hidden">
              <h3 className="text-[1.05rem] font-semibold leading-7 text-gray-900">
                {faq.question}
              </h3>
              {/* plus in a circle, turns into an x when open */}
              <span
                aria-hidden="true"
                className="grid size-7 shrink-0 place-items-center rounded-full border border-gray-200 bg-white text-theme-700 transition-transform duration-200 group-open:rotate-45 group-open:border-theme-200 motion-reduce:transition-none"
              >
                <Plus className="size-4" />
              </span>
            </summary>
            <div className="mx-4 space-y-2 border-t border-theme-100 pb-4 pt-3 font-medium leading-[1.9] text-slate-600">
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
