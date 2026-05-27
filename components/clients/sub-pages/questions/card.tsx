"use client";
// React & Next
import Link from "next/link";

// utils
import { findCategory } from "@/utils";
import { dateToString } from "@/utils/date";

// prisma types
import { Question } from "@/lib/generated/prisma/client";

// icons
import { ThumbsUp, MessageSquare, User, ChevronLeft } from "lucide-react";

interface Props {
  question: Question;
  index: number;
}

// Category accent colors mapped to Tailwind classes
const CATEGORY_COLORS: Record<string, string> = {
  FAMILY: "bg-rose-50 text-rose-600 border-rose-100",
  PSYCHIC: "bg-violet-50 text-violet-600 border-violet-100",
  LAW: "bg-amber-50 text-amber-700 border-amber-100",
  PERSONAL: "bg-emerald-50 text-emerald-600 border-emerald-100",
};

const CATEGORY_BORDER: Record<string, string> = {
  FAMILY: "border-rose-300",
  PSYCHIC: "border-violet-300",
  LAW: "border-amber-300",
  PERSONAL: "border-emerald-300",
};

export default function QuestionCard({ question, index }: Props) {
  const categoryMeta = question.category
    ? findCategory(question.category)
    : null;
  const colorClass = question.category
    ? (CATEGORY_COLORS[question.category] ??
      "bg-slate-50 text-slate-600 border-slate-100")
    : "bg-slate-50 text-slate-600 border-slate-100";
  const borderClass = question.category
    ? (CATEGORY_BORDER[question.category] ?? "border-slate-300")
    : "border-slate-200";

  const isAnswered = !!question.answer;

  return (
    <Link
      href={`/questions/${question.qid}`}
      className="group block"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <article
        className={`
          relative bg-white rounded-xl border border-slate-200
          border-r-4 ${borderClass}
          p-5 h-full flex flex-col gap-4
          transition-all duration-200
          hover:shadow-md hover:-translate-y-0.5 hover:border-r-theme
          cursor-pointer
        `}
      >
        {/* Top row: category badge + answered indicator */}
        <div className="flex items-center justify-between">
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${colorClass}`}
          >
            {categoryMeta?.category ?? "عام"}
          </span>

          <div className="flex items-center gap-2">
            {isAnswered ? (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full font-medium">
                <MessageSquare className="w-3 h-3" />
                مُجاب
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">
                بانتظار الإجابة
              </span>
            )}
          </div>
        </div>

        {/* Question title / number */}
        <div>
          <p className="text-[11px] text-slate-400 mb-1"># {question.qid}</p>
          {question.title ? (
            <h2 className="text-base font-bold text-slate-800 leading-relaxed line-clamp-2 group-hover:text-theme transition-colors">
              {question.title}
            </h2>
          ) : (
            <h2 className="text-base font-bold text-slate-800 leading-relaxed line-clamp-2 group-hover:text-theme transition-colors">
              {question.question}
            </h2>
          )}

          {/* Show question body if title exists */}
          {question.title && (
            <p className="text-sm text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {question.question}
            </p>
          )}
        </div>

        {/* Answer preview (if answered) */}
        {isAnswered && (
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex-1">
            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
              {question.answer}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-semibold">
              {question.anonymous ? (
                <User className="w-3.5 h-3.5" />
              ) : (
                (question.name?.slice(0, 1) ?? "؟")
              )}
            </div>
            <span className="text-xs text-slate-500">
              {question.anonymous ? "مجهول" : question.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Likes */}
            {(question.likes ?? 0) > 0 && (
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{question.likes}</span>
              </div>
            )}

            {/* Date */}
            <span className="text-xs text-slate-400">
              {dateToString(question.created_at)}
            </span>

            {/* Arrow */}
            <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-theme transition-colors" />
          </div>
        </div>
      </article>
    </Link>
  );
}
