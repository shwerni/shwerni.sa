// React & Next
import React from "react";
import Link from "next/link";

// components
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Stars from "../../shared/stars";

// icons
import { ThumbsUp, User } from "lucide-react";

// types & utils
import { Consultant, Question } from "@/lib/generated/prisma/client";
import { findCategory } from "@/utils";
import { dateToString } from "@/utils/date";

interface Props {
  question: Question & {
    consultant: Pick<Consultant, "category" | "rate" | "name" | "rate"> | null;
  };
}

export default function QuestionContent({ question }: Props) {
  // Derived Variables
  const isAnonymous = question.anonymous;
  const consultant = question.consultant;

  const userName = isAnonymous ? "مستخدم مجهول" : question.name || "مستخدم";
  const userInitial = isAnonymous ? <User size={20} /> : userName.charAt(0);
  const questionCategory = question.category
    ? findCategory(question.category)?.category
    : "عام";

  const consultantName = consultant?.name || "مستشار غير معروف";

  const consultantInitial = consultantName.charAt(0);

  const consultantCategory = consultant?.category
    ? findCategory(consultant.category)?.label
    : "مستشار";

  return (
    <article className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 md:p-8">
        {/* --- TOP HEADER (Metadata & Category) --- */}
        <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <span className="text-sm font-medium text-gray-400">
            سؤال رقم #{question.qid}
          </span>
          <Badge
            variant="secondary"
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors"
          >
            {questionCategory}
          </Badge>
        </header>

        {/* --- QUESTION TITLE --- */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight mb-6">
          {question.title}
        </h2>

        {/* --- QUESTION AUTHOR --- */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-600 rounded-full font-bold shadow-sm">
            {userInitial}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{userName}</h3>
            <p className="text-xs text-gray-500">السائل</p>
          </div>
        </div>

        {/* --- QUESTION BODY --- */}
        <div className="prose prose-lg text-gray-700 leading-relaxed max-w-none break-words mb-8">
          <p className="whitespace-pre-line">{question.question}</p>
        </div>

        <Separator className="my-8" />

        {/* --- ANSWER SECTION --- */}
        <section className="bg-gray-50 rounded-2xl border border-gray-100 p-5 md:p-7">
          <h4 className="text-sm font-bold text-zblue-200 mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zblue-200"></span>
            إجابة المستشار
          </h4>

          {/* Consultant Info */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-5 border-b border-gray-200">
            <Link
              href={`/consultant/${question.consultantId}`}
              className="group flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-white border border-gray-200 text-zblue-200 rounded-full font-bold shadow-sm group-hover:border-zblue-200 transition-colors">
                {consultantInitial}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-gray-900 group-hover:text-zblue-200 transition-colors">
                  {consultantName}
                </span>
                <span className="text-sm text-gray-500 mt-0.5">
                  {consultantCategory}
                </span>
              </div>
            </Link>

            {/* Consultant Rating */}
            {!!consultant?.rate && consultant.rate > 0 && (
              <div className="flex flex-col gap-1 items-end">
                <span className="text-xs text-gray-500">التقييم</span>
                <Stars rate={consultant.rate} />
              </div>
            )}
          </div>

          {/* Answer Text */}
          <div className="prose prose-lg text-gray-800 leading-relaxed max-w-none break-words">
            <p className="whitespace-pre-line">{question.answer}</p>
          </div>
        </section>
      </div>

      {/* --- FOOTER --- */}
      <footer className="bg-gray-50 border-t border-gray-100 px-5 py-4 md:px-8 flex flex-row justify-between items-center text-sm text-gray-500">
        <button className="flex items-center gap-2 hover:text-gray-900 transition-colors group">
          <ThumbsUp className="w-5 h-5 text-gray-400 group-hover:text-zblue-200 transition-colors" />
          {question.likes > 0 && (
            <span className="font-medium">{question.likes}</span>
          )}
        </button>
        <time
          dateTime={question.created_at?.toString()}
          className="font-medium"
        >
          {dateToString(question.created_at)}
        </time>
      </footer>
    </article>
  );
}
