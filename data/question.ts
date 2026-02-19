"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { QuestionState } from "@/lib/generated/prisma/enums";

// get questions meta data
export const getQuestionsInfo = async (qid: number) => {
  try {
    const questions = await prisma.question.findUnique({
      where: { qid },
      select: { title: true },
    });
    return questions;
  } catch {
    return null;
  }
};

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

// get question's title by qid
export const getQuestionTitleByQid = async (qid: number) => {
  try {
    const question = await prisma.question.findFirst({
      where: { qid },
      select: { title: true },
    });
    return question?.title;
  } catch {
    return null;
  }
};

// get question by qid
export const getQuestionByQid = async (qid: number) => {
  try {
    const question = await prisma.question.findFirst({
      where: { qid },
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
