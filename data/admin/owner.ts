"use server";
// prisma db
import prisma from "@/lib/database/db";

// pacakges
import { z } from "zod";

// schemas
import { OwnerSchema } from "@/schemas/admin";

// prisma types
import {
  ApprovalState,
  ConsultantState,
  UserRole,
} from "@/lib/generated/prisma/enums";

// get all consultant profiles
export const getAllConsultantsAdmin = async () => {
  try {
    // get all conultants owners
    const owners = await prisma.consultant.findMany({
      orderBy: [
        {
          updated_at: "desc",
        },
        {
          created_at: "desc",
        },
      ],
    });
    // return
    return owners;
  } catch {
    return undefined;
  }
};

// get all consultant profiles
export const getApprovedConsultantsAdmin = async () => {
  try {
    // get all conultants owners
    const owners = await prisma.consultant.findMany({
      where: {
        approved: ApprovalState.APPROVED,
      },
      orderBy: [
        {
          updated_at: "desc",
        },
        {
          created_at: "desc",
        },
      ],
    });
    // return
    return owners;
  } catch {
    return undefined;
  }
};

// get all consultant profiles
export const getNotApprovedConsultantsAdmin = async () => {
  try {
    // get all conultants owners
    const owners = await prisma.consultant.findMany({
      where: {
        NOT: { approved: ApprovalState.APPROVED },
      },
      orderBy: [
        {
          updated_at: "desc",
        },
        {
          created_at: "desc",
        },
      ],
    });
    // return
    return owners;
  } catch {
    return undefined;
  }
};

// get owners for orders
export const getAllOwnerForOrder = async () => {
  try {
    // get all owner
    const owners = await prisma.consultant.findMany({
      select: {
        id: true,
        cid: true,
        name: true,
        phone: true,
        commission: true,
        cost30: true,
        cost45: true,
        cost60: true,
        statusA: true,
      },
      orderBy: [
        {
          created_at: "desc",
        },
        {
          updated_at: "desc",
        },
      ],
    });
    // return
    return owners;
  } catch (error) {
    // return
    return null;
  }
};

// get all users for owners
// get owners for orders
export const getAllUsersForOwners = async () => {
  try {
    // get all owner
    const owners = await prisma.user.findMany({
      where: {
        role: UserRole.OWNER,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
      orderBy: [
        {
          created_at: "desc",
        },
        {
          updated_at: "desc",
        },
      ],
    });
    // return
    return owners;
  } catch {
    // return
    return null;
  }
};

// update owner info admin
export const updateOwnerAdmin = async (
  cid: number,
  author: string,
  data: z.infer<typeof OwnerSchema>,
) => {
  // new data
  const validatedFields = OwnerSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatedFields)
    return { state: false, message: "something went wrong" };
  try {
    // get all owner
    const owners = await prisma.consultant.update({
      where: { cid },
      data: {
        name: data.name,
        userId: author,
        status: data.status,
        statusA: data.statusA,
        approved: data.approved,
        cost30: data.cost30,
        cost45: data.cost45,
        cost60: data.cost60,
        commission: data.commission,
        rate: data.rate,
        category: data.category,
        gender: data.gender,
        title: data.title,
        phone: data.phone,
        about: String(data.about),
        // nabout: String(data.nabout),
        education: data.education,
        // neducation: data.neducation,
        // nexperiences: data.nexperiences,
        adminNote: data.adminNote,
        updated_at: new Date(),
      },
    });
    // return
    return owners;
  } catch (error) {
    // return
    return null;
  }
};

// update owner image
export const updateOwnerImageAdmin = async (cid: number, image: string) => {
  try {
    // get all owner
    const owners = await prisma.consultant.update({
      where: { cid },
      data: {
        image,
      },
      select: { cid: true },
    });
    // return
    return owners;
  } catch {
    // return
    return null;
  }
};

// delete owner
export const deleteOwnerAdmin = async (cid: number) => {
  try {
    // get all owner
    const owners = await prisma.consultant.delete({
      where: { cid },
    });
    // return
    return owners;
  } catch {
    // return
    return null;
  }
};

// bulk status
export const bulkStatusOwnerAdmin = async (
  cids: number[],
  statusA: ConsultantState,
) => {
  try {
    // update status bulk
    await prisma.consultant.updateMany({
      where: { cid: { in: cids } },
      data: {
        statusA,
      },
    });
    return true;
  } catch {
    return null;
  }
};
