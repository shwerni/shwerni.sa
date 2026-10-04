import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { QuestionState } from "@/lib/generated/prisma/enums";

// get all published questions
export const getAllPublishedQuestion = async () => {
  try {
    const questions = await prisma.question.findMany({
      where: { status: QuestionState.PUBLISHED },
    });
    return questions;
  } catch {
    return null;
  }
};

// get question by qid
export const getQuestionByQid = async (qid: number) => {
  try {
    const question = await prisma.question.findFirst({
      where: {
        qid,
        // not answered by a center consultant (questions without a consultant stay)
        NOT: { consultant: { is: { centerId: { not: null } } } },
      },
      include: {
        consultant: {
          select: {
            rate: true,
            category: true,
            cid: true,
            name: true,
          },
        },
      },
    });
    return question;
  } catch {
    return null;
  }
};

// create new question // later
// export const createQuestion = async (
//   author: string,
//   name: string,
//   data: z.infer<typeof QuestionSchema>
// ) => {};
