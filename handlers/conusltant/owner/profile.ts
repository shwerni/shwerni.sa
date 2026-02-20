"use server";
// prisma db

// packages
import { z } from "zod";

// prisma types
import {
  ApprovalState,
  ConsultantState,
  GenderPreference,
} from "@/lib/generated/prisma/enums";

// schemas
import { ConsultantSchema } from "@/schemas";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";
import { getTaxCommission } from "@/data/admin/settings/finance";

// lib
import { aiAcceptOwners } from "@/lib/api/ai/ai";
import { sendReviewerNotification } from "@/lib/api/telegram/templates/owner";
import prisma from "@/lib/database/db";

// save or create owner profile
export const saveConsultant = async (
  author: string,
  phone: string,
  data: z.infer<typeof ConsultantSchema>,
  image: string,
  cv: string,
  edu: string,
  cert: string,
  nabout: string,
  nexperiences: string[],
  neducation: string[],
  preference: GenderPreference,
  ndate: string,
) => {
  // get data
  const validatedFields = ConsultantSchema.safeParse(data);

  // if data wrong
  if (!validatedFields) return { state: false, message: "بيانات خاطئة" };

  // if data validate
  if (validatedFields.data) {
    // get commisson and tax
    const taxCommission = await getTaxCommission();

    // try
    try {
      // get consultant if exist
      const consultant = await getOwnerbyAuthor(author);

      // if not exist
      if (!consultant) {
        // create consultant
        const newOwner = await prisma.consultant.create({
          data: {
            status: true,
            statusA: ConsultantState.HOLD,
            phone: phone,
            name: data.name,
            userId: author,
            title: data.title,
            gender: data.gender,
            category: data.category,
            image,
            cv,
            edu,
            cert,
            cost30: data.cost30,
            cost45: data.cost45,
            cost60: data.cost60,
            iban: data.iban,
            bankName: data.bankName,
            commission: taxCommission?.commission,
            nabout,
            nexperiences,
            neducation,
            preference,
            seniority: new Date(ndate),
          },
        });

        // send notifications
        await sendReviewerNotification(newOwner);

        // return
        return {
          consultant: newOwner,
          state: true,
          message: "تم انشاء الاعلان بنجاح",
        };
      }

      // qualified
      const qualified =
        consultant.approved === ApprovalState.APPROVED &&
        (image === "" || image === consultant.image) &&
        consultant.name === data.name;

      // check ai
      const acceptAi =
        qualified &&
        (await aiAcceptOwners(
          data.nabout || "",
          data.neducation.join("."),
          data.nexperiences.join("."),
        ));

      // accept
      const accept = acceptAi && qualified;

      // update current owner
      const sdata = await prisma.consultant.update({
        where: {
          userId: author,
        },
        data: {
          status: true,
          statusA: accept ? ConsultantState.PUBLISHED : ConsultantState.HOLD,
          phone: phone,
          name: data.name,
          title: data.title,
          gender: data.gender,
          image,
          cv,
          edu,
          cert,
          category: data.category,
          cost30: data.cost30,
          cost45: data.cost45,
          cost60: data.cost60,
          iban: data.iban,
          bankName: data.bankName,
          adminNote: "",
          nabout,
          nexperiences,
          neducation,
          preference,
          seniority: new Date(ndate),
        },
      });

      // return
      return {
        consultant: sdata,
        state: true,
        message: "تم حفظ البيانات بنجاح",
      };
    } catch {
      return {
        state: false,
        message: "حدث حطأ ما برجاء المحاولة مرة اخري",
      };
    }
  }
};

// toggle profile visibility user
export const ownerVisibility = async (author: string, state: boolean) => {
  // try
  try {
    // get consultant if exist
    const consultant = await getOwnerbyAuthor(author);

    // if not exist
    if (!consultant)
      return {
        state: false,
        message: "حدث حطأ ما برجاء المحاولة مرة اخري",
      };

    // update current owner
    await prisma.consultant.update({
      where: {
        userId: author,
      },
      data: {
        status: state,
      },
    });

    // return
    return {
      state: true,
      message: `تم تغيير حالة الاعلان الي ${state ? "نشط" : "معطل"}`,
    };
  } catch {
    return {
      state: false,
      message: "حدث حطأ ما برجاء المحاولة مرة اخري",
    };
  }
};
