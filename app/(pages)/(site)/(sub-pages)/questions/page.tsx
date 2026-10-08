// React & Next
import { Suspense } from "react";
import { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

// components
import Section from "@/components/clients/shared/section";
import QuestionsListClient from "@/components/clients/sub-pages/questions/list";
import CardSkeleton from "@/components/clients/shared/card-skeleton";

// prisma data
import { getAllPublishedQuestion } from "@/data/question";

export const metadata: Metadata = {
  title: "سؤال وجواب | شاورني",
  description:
    "تصفح أسئلة المستخدمين وإجابات المختصين في مجالات الأسرة والنفس والقانون والتنمية الشخصية.",
};

// cached; the dashboard can refresh it through /api/revalidate with the "questions" tag
async function getCachedQuestions() {
  "use cache";
  cacheLife("hours");
  cacheTag("questions");
  return getAllPublishedQuestion();
}

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {

  return (
    <Section>
      {/* Page header */}
      <div className="w-11/12 max-w-6xl mx-auto mb-8">
        <div className="border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold tracking-widest text-theme uppercase mb-2">
            المعرفة المشتركة
          </p>
          <h1 className="text-3xl font-bold text-slate-900">سؤال وجواب</h1>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">
            إجابات موثوقة من مختصين معتمدين
          </p>
        </div>
      </div>

      {/* Client component handles filtering + rendering. it reads the url (nuqs), so it renders
          at request time (in the same response, server-rendered) while the header stays in the
          prerendered shell */}
      <Suspense fallback={<CardSkeleton count={4} className="w-11/12 max-w-6xl mx-auto space-y-4" CardClassName="w-full" />}>
        <QuestionsList searchParams={searchParams} />
      </Suspense>
    </Section>
  );
}

async function QuestionsList({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await searchParams;
  const questions = await getCachedQuestions();
  return <QuestionsListClient questions={questions ?? []} />;
}
