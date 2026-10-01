// this file is refrence the /consultant is the main file
import "server-only";

// React & Next
import { cacheLife, cacheTag } from "next/cache";

// lib
import prisma from "@/lib/database/db";

// example only: match model and field names to your schema

// public read: cached and tagged, returns only what the card renders
export async function getPublishedConsultantsForHome() {
  "use cache";
  cacheTag("consultants:home");
  cacheLife("hours");

  return prisma.consultant.findMany({
    where: { status: true },
    select: { id: true, name: true, image: true, title: true },
    orderBy: { created_at: "desc" },
    take: 12,
  });
}

// owner read for the dashboard: never cached, scoped to the session user
export async function getOwnConsultantVisibility(author: string) {
  // prisma drops undefined filters, which would match every row
  if (!author) throw new Error("getOwnConsultantVisibility: missing author");

  return prisma.consultant.findFirst({
    where: { userId: author },
    select: { status: true },
  });
}

// owner write: another user's record matches nothing, exactly like a missing one
export async function setOwnConsultantVisibility(
  author: string,
  published: boolean,
) {
  if (!author) throw new Error("setOwnConsultantVisibility: missing author");

  const { count } = await prisma.consultant.updateMany({
    where: { userId: author },
    data: { status: published },
  });

  return count > 0;
}
