"use server";
// prisma data
import { Consultant } from "@/lib/generated/prisma/client";

// lib
import { telegramDocuments, telegramEmployees } from "../telegram";

// utils
import { findCategory } from "@/utils";

export const sendReviewerNotification = async (consultant: Consultant) => {
    // telegram id
    const telegramId = "7801620";
    
    // send consultant data
  await telegramEmployees(
      telegramId,
      `مستشار جديد\nتم طلب قبول مستشار جديد علي منصة شاورني\nالاسم: ${
          consultant.name
        }\nرقم القيد: ${consultant.cid}\nرقم الهاتف: ${consultant.phone}\nالفئة: ${
            findCategory(consultant.category)?.label
        }`
    );
    // send documents
    // certification
    if (consultant.cert) {
        await telegramDocuments(telegramId, consultant.cert);
    }
    
    // cv
    if (consultant.cv) {
        await telegramDocuments(telegramId, consultant.cv);
    }
    
    // education
    if (consultant.edu) {
        await telegramDocuments(telegramId, consultant.edu);
    }
};
