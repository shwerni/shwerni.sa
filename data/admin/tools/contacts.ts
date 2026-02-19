"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { ApprovalState, ConsultantState, PaymentState } from "@/lib/generated/prisma/enums";

// get all unique phones
export const getAllPhonesAdmin = async () => {
  try {
    const exist = await prisma.order.findMany({
      where: {
        payment: {
          payment: PaymentState.PAID,
        },
      },
      select: {
        phone: true,
      },
    });

    const phones = Array.from(
      exist.reduce((set, order) => set.add(order.phone), new Set<string>()),
    );
    return phones;
  } catch {
    return null;
  }
};

export const getClientsContactsAdmin = async () => {
  try {
    const consultants = await prisma.consultant.findMany({
      distinct: ["phone"],
      select: {
        phone: true,
      },
    });

    // Paid (exclude REFUND)
    const paidRaw = await prisma.order.findMany({
      where: {
        payment: {
          payment: PaymentState.PAID,
        },
      },
      distinct: ["phone"],
      select: {
        name: true,
        phone: true,
      },
    });

    // Unpaid (exclude REFUND)
    const unpaidRaw = await prisma.order.findMany({
      where: {
        payment: {
          payment: {
            in: [
              PaymentState.NEW,
              PaymentState.PROCESSING,
              PaymentState.HOLD,
              PaymentState.REFUSED,
              PaymentState.CANCELED,
            ],
          },
        },
      },
      distinct: ["phone"],
      select: {
        name: true,
        phone: true,
      },
    });

    const dedupeByPhone = <T extends { phone: string | null | undefined }>(
      items: T[],
    ): T[] =>
      items.filter(
        (item, index, self) =>
          item.phone && self.findIndex((c) => c.phone === item.phone) === index,
      );

    const paid = dedupeByPhone(paidRaw);
    const unpaidDedupe = dedupeByPhone(unpaidRaw);

    // Phones that belong to consultants
    const consultantPhones = new Set(
      consultants.map((c) => c.phone).filter(Boolean) as string[],
    );

    // Remove from unpaid any phone that exists in paid
    const paidPhones = new Set(
      paid.map((c) => c.phone).filter(Boolean) as string[],
    );
    const unpaidNoPaid = unpaidDedupe.filter(
      (c) => c.phone && !paidPhones.has(c.phone),
    );

    // Finally, remove consultant phones from both paid and unpaid
    const paidFiltered = paid.filter(
      (c) => c.phone && !consultantPhones.has(c.phone),
    );
    const unpaidFiltered = unpaidNoPaid.filter(
      (c) => c.phone && !consultantPhones.has(c.phone),
    );

    return { paid: paidFiltered, unpaid: unpaidFiltered };
  } catch {
    return null;
  }
};

// get all unique contacts
export const getAllOwnersContactsAdmin = async () => {
  try {
    const contacts = await prisma.consultant.findMany({
      where: {
        statusA: ConsultantState.PUBLISHED,
        approved: ApprovalState.APPROVED,
      },
      distinct: ["phone"],
      select: {
        name: true,
        phone: true,
      },
    });

    // remove duplicates by phone
    const filtered = contacts.filter(
      (contact, index, self) =>
        contact.phone &&
        self.findIndex((c) => c.phone === contact.phone) === index,
    );

    return filtered;
  } catch {
    return null;
  }
};
