"use server";
// prisma db
import prisma from "@/lib/database/db";

// schemas
import { FreeSessionSchema} from "@/schemas/admin";

// pacakge
import { z } from "zod";

// get all meetings
export const getAllFreeSessions = async () => {
  try {
    // get order url
    const sessions = await prisma.freeSession.findMany();

    // sorted
    const sortedMeetings = sessions.sort((a, b) => {
      // sort
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return Number(dateB) - Number(dateA);
    });

    // return
    return sortedMeetings;
  } catch {
    // return
    return null;
  }
};

// update meeting
export const updateFreeSessionAdmin = async (
  fid: number,
  data: z.infer<typeof FreeSessionSchema>,
  session?: number
) => {
  // new data
  const validatedFields = FreeSessionSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatedFields)
    return { state: false, message: "something went wrong" };

  try {
    // get all owner
    const order = await prisma.freeSession.update({
      where: { fid },
      data: {
        ownerAttend: data?.ownerAttend ?? false,
        clientAttend: data?.clientAttend ?? false,
        clientATime: data?.clientATime ?? "",
        ownerATime: data?.ownerATime ?? "",
        url: data?.url ?? "",
      },
    });
    // return
    return order;
  } catch (error) {
    // return
    return null;
  }
};
