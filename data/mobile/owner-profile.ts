import "server-only";

// prisma db
import prisma, { prismaAll } from "@/lib/database/db";

// lib
import { normalizeIban } from "@/lib/api/gatewaies/iban";

// constants
import { getSaudiBank } from "@/constants/saudi-banks";

// schemas
import { dateToYears } from "@/schemas/consultant/profile";

// prisma types
import type {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  GenderPreference,
} from "@/lib/generated/prisma/enums";

// the owner's own consultant row, as the profile form needs it
const profileSelect = {
  cid: true,
  approved: true,
  statusA: true,
  status: true,
  adminNote: true,
  name: true,
  title: true,
  nabout: true,
  gender: true,
  preference: true,
  image: true,
  pendingImage: true,
  neducation: true,
  nexperiences: true,
  seniority: true,
  category: true,
  cv: true,
  edu: true,
  cert: true,
  cost30: true,
  cost45: true,
  cost60: true,
  created_at: true,
  bankAccount: { select: { holderName: true, iban: true, bankCode: true } },
} as const;

// bank account as the owner sees it: the iban never leaves the server in full
export interface OwnerProfileBank {
  holderName: string | null;
  ibanMasked: string;
  bankName: string;
}

// GET /api/mobile/owner/profile -> profile
export interface OwnerProfile {
  cid: number;
  approval: ApprovalState;
  // Consultant.statusA, same meaning as GET /owner/status
  listing: ConsultantState;
  // Consultant.status, the consultant's own show / hide switch
  visible: boolean;
  adminNote: string | null;
  name: string;
  title: string;
  nabout: string;
  gender: Gender;
  preference: GenderPreference;
  image: string | null;
  pendingImage: string | null;
  neducation: string[];
  nexperiences: string[];
  years: number;
  category: Categories;
  cv: string | null;
  edu: string | null;
  cert: string | null;
  cost30: number;
  cost45: number;
  cost60: number;
  bank: OwnerProfileBank | null;
}

/**
 * iban with only its last 4 digits visible, grouped like the website ("SA•• •••• … 1234")
 * @param iban stored iban
 */
const maskIban = (iban: string) => {
  const normalized = normalizeIban(iban);
  const hidden = normalized.slice(2, -4).replace(/./g, "•");
  return `SA${hidden}${normalized.slice(-4)}`.replace(/(.{4})/g, "$1 ").trim();
};

/**
 * the signed-in owner's consultant row (safe client: center consultants read as none),
 * with created_at for the license rule and the full bank row for server-side use only
 * @param userId session user id
 */
export const getOwnerProfileRow = (userId: string) =>
  prisma.consultant.findUnique({
    where: { userId },
    select: profileSelect,
  });

export type OwnerProfileRow = NonNullable<
  Awaited<ReturnType<typeof getOwnerProfileRow>>
>;

/**
 * maps the row to what the app may see (masked iban, years instead of a start date)
 * @param row the owner's consultant row
 */
export const toOwnerProfile = (row: OwnerProfileRow): OwnerProfile => ({
  cid: row.cid,
  approval: row.approved,
  listing: row.statusA,
  visible: row.status,
  adminNote: row.adminNote || null,
  name: row.name,
  title: row.title,
  nabout: row.nabout,
  gender: row.gender,
  preference: row.preference,
  image: row.image,
  pendingImage: row.pendingImage,
  neducation: row.neducation,
  nexperiences: row.nexperiences,
  years: dateToYears(new Date(row.seniority)),
  category: row.category,
  cv: row.cv,
  edu: row.edu,
  cert: row.cert,
  cost30: row.cost30,
  cost45: row.cost45,
  cost60: row.cost60,
  bank: row.bankAccount
    ? {
        holderName: row.bankAccount.holderName,
        ibanMasked: maskIban(row.bankAccount.iban),
        bankName: getSaudiBank(row.bankAccount.bankCode).ar,
      }
    : null,
});

/**
 * whether this user already has any consultant row, center consultants included,
 * so POST never tries to create a second one
 * @param userId session user id
 */
export const ownerRowExists = async (userId: string) =>
  !!(await prismaAll.consultant.findUnique({
    where: { userId },
    select: { cid: true },
  }));

/**
 * the phone saved on the consultant row, from the user's account
 * @param userId session user id
 */
export const getOwnerPhone = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  });
  return user?.phone ?? null;
};

/**
 * files may be linked only to the uploader's own profile: each url must be already stored
 * on this owner's row (e.g. uploaded on the website), or logged by the mobile upload route
 * with title = this user id (images in images, pdfs in files)
 * @param userId session user id
 * @param row the owner's current row, null on create
 * @param images photo urls to check
 * @param pdfs document urls to check (cv, edu, cert)
 */
export const ownsUploads = async (
  userId: string,
  row: OwnerProfileRow | null,
  images: string[],
  pdfs: string[],
) => {
  const stored = new Set(
    [row?.image, row?.pendingImage, row?.cv, row?.edu, row?.cert].filter(
      (url): url is string => !!url,
    ),
  );

  const newImages = [...new Set(images.filter((url) => url && !stored.has(url)))];
  const newPdfs = [...new Set(pdfs.filter((url) => url && !stored.has(url)))];

  // distinct urls, so a file logged twice still matches once
  const [imageRows, pdfRows] = await Promise.all([
    newImages.length
      ? prisma.image.findMany({
          where: { title: userId, url: { in: newImages } },
          select: { url: true },
          distinct: ["url"],
        })
      : [],
    newPdfs.length
      ? prisma.file.findMany({
          where: { title: userId, url: { in: newPdfs } },
          select: { url: true },
          distinct: ["url"],
        })
      : [],
  ]);

  return (
    imageRows.length === newImages.length && pdfRows.length === newPdfs.length
  );
};
