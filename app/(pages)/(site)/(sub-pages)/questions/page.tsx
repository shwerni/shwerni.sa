// React & Next
import { Metadata } from "next";

// components
import Section from "@/components/clients/shared/section";
import QuestionsListClient from "@/components/clients/sub-pages/questions/list";

// prisma data
import { getAllPublishedQuestion } from "@/data/question";

export const metadata: Metadata = {
  title: "سؤال وجواب | شاورني",
  description:
    "تصفح أسئلة المستخدمين وإجابات المختصين في مجالات الأسرة والنفس والقانون والتنمية الشخصية.",
};

export default async function QuestionsPage() {
  const questions = await getAllPublishedQuestion();

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

      {/* Client component handles filtering + rendering */}
      <QuestionsListClient questions={questions ?? []} />
    </Section>
  );
}
