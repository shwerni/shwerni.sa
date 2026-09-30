import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// schemas
import { AdvisorResponse, ClientIssue } from "@/schemas";

// packages
import { z } from "zod";

// lib

// primsa types
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma data
import { getUserById, getUsersByRole } from "./user";
import { notificationNewPreConsultation } from "@/lib/notifications/site";

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
