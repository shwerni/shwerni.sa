// packages
import type { NextRequest } from "next/server";
import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

// lib
import prisma from "@/lib/database/db";
import { rateLimit } from "@/lib/rate-limit";
import { requireMobileOwner } from "@/lib/auth/require-approved-owner";

// config
const f = createUploadthing();

// per owner, so a session can't be used to store files without limit
const UPLOAD_LIMIT = { limit: 30, window: "1 h" } as const;

/**
 * the signed-in mobile owner behind an upload (x-session-token), or an uploadthing error;
 * lives outside /api/mobile because uploadthing's server callback has no x-app-secret
 * @param req upload request from the app
 */
async function requireUploader(req: NextRequest) {
  let userId: string;
  try {
    userId = (await requireMobileOwner(req)).id;
  } catch {
    throw new UploadThingError({ code: "FORBIDDEN", message: "Unauthorized" });
  }

  if (!(await rateLimit(`owner.upload:${userId}`, UPLOAD_LIMIT))) {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "Too many uploads",
    });
  }

  return { userId };
}

// consultant profile files from the app: one image (photo) or one pdf (cv, edu, cert) per
// request. each upload is logged with title = the owner's user id, which is what lets
// POST / PATCH /api/mobile/owner/profile link it to that owner's profile only
export const mobileFileRouter = {
  ownerImage: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(({ req }) => requireUploader(req))
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.image.create({
        data: { key: file.key, title: metadata.userId, url: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),
  ownerPdf: f({ pdf: { maxFileSize: "16MB", maxFileCount: 1 } })
    .middleware(({ req }) => requireUploader(req))
    .onUploadComplete(async ({ metadata, file }) => {
      await prisma.file.create({
        data: { key: file.key, title: metadata.userId, url: file.ufsUrl },
      });
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type MobileFileRouter = typeof mobileFileRouter;
