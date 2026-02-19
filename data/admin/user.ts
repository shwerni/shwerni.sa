"use server";
// prisma db
import prisma  from "@/lib/database/db";

// schema
import { UserAdminSchema } from "@/schemas/admin";

// packages
import { z } from "zod";
import bcrypt from "bcryptjs";

// prisma types
import { UserRole } from "@/lib/generated/prisma/client";

// get unique user by email
export const getAllUsersAdmin = async () => {
  try {
    const exist = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
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
    return exist;
  } catch {
    return null;
  }
};

export const updateUserAdmin = async (
  id: string,
  data: z.infer<typeof UserAdminSchema>
) => {
  // new data
  const validatedFields = UserAdminSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatedFields) return false;
  // password
  if (data.password && data.password.length > 3) {
    // new encrypt passwrord - bcrypt hasing
    const newPassword = await bcrypt.hash(data.password, 10);
    // update password
    await prisma.user.update({
      where: { id },
      data: { password: newPassword },
      select: { id: true },
    });
  }
  // email
  if (data.email && data.email.length > 3) {
    // update email
    await prisma.user.update({
      where: { id },
      data: { email: data.email },
      select: { id: true },
    });
  }

  // update
  try {
    // get user
    const user = await prisma.user.update({
      where: { id },
      data: {
        id: data.id,
        phone: data.phone,
        name: data.name,
        phoneVerified: new Date(data.phoneVerified),
        role: data.role as UserRole,
        image: data.image ?? "",
        updated_at: new Date(),
      },
      select: { id: true },
    });
    // return
    return user.id;
  } catch (error) {
    // return
    return null;
  }
};
