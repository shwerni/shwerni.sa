// React & Next
import { Metadata } from "next";
import { notFound } from "next/navigation";

// components
import Section from "@/components/clients/shared/section";
import BackButton from "@/components/clients/sub-pages/questions/back";
import QuestionContent from "@/components/clients/sub-pages/questions/question";

// prisma data
import { getConsultant } from "@/data/consultant";
import { getQuestionByQid } from "@/data/question";

interface Props {
  params: Promise<{ qid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { qid } = await params;
  const question = await getQuestionByQid(Number(qid));

  if (!question) return { title: "سؤال غير موجود" };

  const title = question.title ?? question.question.slice(0, 80);
  const description = question.answer
    ? question.answer.slice(0, 155)
    : question.question.slice(0, 155);

  return {
    title: `${title} | سؤال وجواب`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
}

export default async function QuestionPage({ params }: Props) {
  const { qid } = await params;

  const question = await getQuestionByQid(Number(qid));

  if (!question || question.status !== "PUBLISHED") notFound();

  // fetch consultant only if cid exists
  const owner = question.cid ? await getConsultant(question.cid) : null;

  return (
    <Section>
      <div className="w-11/12 max-w-3xl mx-auto mb-6">
        <BackButton />
      </div>
      <QuestionContent question={question} owner={owner ?? undefined} />
    </Section>
  );
}
