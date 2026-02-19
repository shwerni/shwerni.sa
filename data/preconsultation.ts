"use server";
// prisma db
import prisma from "@/lib/database/db";

// schemas
import { AdvisorResponse, ClientIssue } from "@/schemas";

// packages
import { z } from "zod";

// lib
import { notificationWPreConsultationResponse } from "@/lib/notifications/whatsapp";

// primsa types
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma data
import { getUserById, getUsersByRole } from "./user";
import { notificationNewPreConsultation } from "@/lib/notifications";

// get get pre consultation seassion
export const getPreConsultationSeassion = async (id: string) => {
  try {
    const seassion = await prisma.preConsultation.findUnique({
      where: { id },
    });
    return seassion;
  } catch {
    return null;
  }
};

// create new pre consultation seassion
export const newPreConsultationSeassion = async (
  author: string,
  data: z.infer<typeof ClientIssue>
) => {
  try {
    // get data
    const validatedFields = ClientIssue.safeParse(data);

    // if not exist
    if (!validatedFields || !validatedFields.data) return null;

    // if the seassion exist
    const exist = await prisma.preConsultation.findFirst({
      where: {
        phone: data.phone,
      },
      select: {
        id: true,
      },
    });

    // if exist dont create new
    if (exist) return exist?.id;

    // get coordinator
    const coordinators = await getUsersByRole(UserRole.COORDINATOR);

    // if no coordinators
    if (!coordinators || !coordinators[0]) return null;

    // create session
    const session = await prisma.preConsultation.create({
      data: {
        author,
        name: data.name,
        phone: data.phone,
        issue: data.issue,
        advisor: coordinators[0].id,
      },
    });

    // send notification to advior (coordiantor)
    await notificationNewPreConsultation(
      coordinators[0].phone ?? "201222166530",
      session.name,
      coordinators[0].name ?? "المنسق",
      session.pid
    );

    // return
    return session.id;
  } catch {
    return null;
  }
};

// update pre consultation seassion
export const updatePreConsultationSeassion = async (
  id: string,
  advisorId: string,
  data: z.infer<typeof AdvisorResponse>
) => {
  try {
    // get data
    const validatedFields = AdvisorResponse.safeParse(data);

    // if not exist
    if (!validatedFields || !validatedFields.data) return null;

    // get session
    const session = await prisma.preConsultation.findUnique({
      where: {
        id,
      },
    });

    // if not exist
    if (!session) return null;

    // update session
    await prisma.preConsultation.update({
      where: {
        id,
      },
      data: {
        response: data.response,
        responded_at: new Date(),
      },
    });

    // get coordinator by id
    const coordinator = await getUserById(advisorId);
    console.log(!session.response);

    // send notification to user
    if (!session.response) {
      await notificationWPreConsultationResponse(
        session.id,
        session.phone,
        session.name,
        coordinator?.name ?? "المنسق",
        session.pid
      );
    }

    // return
    return session.id;
  } catch {
    return null;
  }
};
