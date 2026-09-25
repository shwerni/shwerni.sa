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
import { BankAccountSchema } from "@/schemas/consultant/iban";

// prisma data
import { CheckIsBlocked } from "@/data/blocked";
import { getOwnerbyAuthor } from "@/data/consultant";
import { getTaxCommission } from "@/data/admin/settings/finance";

// lib
import prisma from "@/lib/database/db";
import { checkSaudiIban } from "@/lib/iban";
import { aiAcceptOwners } from "@/lib/api/ai/ai";
import { sendReviewerNotification } from "@/lib/api/telegram/templates/owner";

// save or create owner profile + bank account
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
  bank: z.infer<typeof BankAccountSchema>,
) => {
  // validate profile
  const validatedFields = ConsultantSchema.safeParse(data);
  if (!validatedFields.success)
    return { state: false, message: "بيانات خاطئة" };
  const profile = validatedFields.data;

  // validate bank; bankCode is derived here, never sent by the client
  const validatedBank = BankAccountSchema.safeParse(bank);
  if (!validatedBank.success)
    return { state: false, message: "بيانات الحساب البنكي غير صحيحة" };
  const ibanCheck = checkSaudiIban(validatedBank.data.iban);
  if (!ibanCheck.ok) return { state: false, message: "رقم الآيبان غير صحيح" };
  const bankData = {
    iban: ibanCheck.iban,
    bankCode: ibanCheck.bankCode,
    holderName: validatedBank.data.holderName,
  };

  // check if blocked
  const isBLocked = await CheckIsBlocked(phone);
  if (isBLocked) return { state: false, message: "هذا الحساب محظور" };

  // get commisson and tax
  const taxCommission = await getTaxCommission();

  // try
  try {
    // get consultant if exist
    const consultant = await getOwnerbyAuthor(author);

    // if not exist: create consultant + bank account together
    if (!consultant) {
      const newOwner = await prisma.$transaction(async (tx) => {
        const created = await tx.consultant.create({
          data: {
            status: true,
            statusA: ConsultantState.HOLD,
            phone: phone,
            name: profile.name,
            userId: author,
            title: profile.title,
            gender: profile.gender,
            category: profile.category,
            image,
            cv,
            edu,
            cert,
            cost30: profile.cost30,
            cost45: profile.cost45,
            cost60: profile.cost60,
            commission: taxCommission?.commission,
            nabout,
            nexperiences,
            neducation,
            preference,
            seniority: new Date(ndate),
          },
        });

        await tx.bankAccount.create({
          data: { consultantId: created.cid, ...bankData },
        });

        return created;
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

    // qualified (bank changes do not affect review)
    const qualified =
      consultant.approved === ApprovalState.APPROVED &&
      consultant.name === profile.name;

    // check ai
    const acceptAi =
      qualified &&
      (await aiAcceptOwners(
        profile.nabout || "",
        profile.neducation.join("."),
        profile.nexperiences.join("."),
      ));

    // accept
    const accept = acceptAi && qualified;

    // update owner + upsert bank account together
    const sdata = await prisma.$transaction(async (tx) => {
      const updated = await tx.consultant.update({
        where: {
          userId: author,
        },
        data: {
          status: true,
          statusA: accept ? ConsultantState.PUBLISHED : ConsultantState.HOLD,
          phone: phone,
          name: profile.name,
          title: profile.title,
          gender: profile.gender,
          pendingImage: image && image !== consultant.image ? image : null,
          cv,
          edu,
          cert,
          category: profile.category,
          cost30: profile.cost30,
          cost45: profile.cost45,
          cost60: profile.cost60,
          adminNote: "",
          nabout,
          nexperiences,
          neducation,
          preference,
          seniority: new Date(ndate),
        },
      });

      await tx.bankAccount.upsert({
        where: { consultantId: updated.cid },
        create: { consultantId: updated.cid, ...bankData },
        update: bankData,
      });

      return updated;
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
