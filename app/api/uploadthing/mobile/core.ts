// packages
import { z } from "zod";
import type { NextRequest } from "next/server";
import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

// lib
import prisma from "@/lib/database/db";
import { rateLimit } from "@/lib/rate-limit";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { mintChatAttachment } from "@/lib/api/realtime/chat-attachment";
import { requireApprovedOwner, requireMobileOwner } from "@/lib/auth/require-approved-owner";

// data
import { getClientChatMeeting } from "@/data/mobile/client-chats";
import { CHAT_WINDOW_MS, chatStart, getOwnerChatMeeting } from "@/data/mobile/owner-chats";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// config
const f = createUploadthing();

// per owner, so a session can't be used to store files without limit
const UPLOAD_LIMIT = { limit: 30, window: "1 h" } as const;

// chat attachments: per user, the same 30 an hour
const CHAT_UPLOAD_LIMIT = { limit: 30, window: "1 h" } as const;

const forbidden = (message = "Unauthorized") =>
  new UploadThingError({ code: "FORBIDDEN", message });

/**
 * who may upload a file to this chat: the same access as sending in it. the client of their own
 * paid order's meeting (any role, as the client chat routes), or the approved consultant of it;
 * never a closed chat (72 hours after the meeting); 30 uploads an hour per user
 * @param req upload request from the app (x-session-token)
 * @param mid the chat's meeting
 */
export async function requireChatUploader(req: NextRequest, mid: string) {
  let user: Awaited<ReturnType<typeof requireMobileUser>>;
  try {
    user = await requireMobileUser(req);
  } catch {
    throw forbidden();
  }

  let meeting: { date: string; time: string } | null = await getClientChatMeeting(user.id, mid);
  if (!meeting && user.role === UserRole.OWNER) {
    try {
      const { consultant } = await requireApprovedOwner(req);
      meeting = await getOwnerChatMeeting(consultant.cid, mid);
    } catch {
      throw forbidden();
    }
  }
  if (!meeting) throw forbidden();

  // the website: a malformed time never closes the chat
  const start = chatStart(meeting.date, meeting.time);
  if (Number.isFinite(start) && Date.now() >= start + CHAT_WINDOW_MS) throw forbidden("Chat closed");

  if (!(await rateLimit(`chat.upload:${user.id}`, CHAT_UPLOAD_LIMIT))) {
    throw forbidden("Too many uploads");
  }

  return { userId: user.id, mid };
}

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
  // a chat image or pdf (the website's chatAttachment types and sizes); the answer carries a
  // signed attachment token the send routes take instead of a raw url (realtime-chat-plan.md feature 3)
  chatAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .input(z.object({ mid: z.string().regex(/^[A-Za-z0-9_-]{1,32}$/) }))
    .middleware(({ req, input }) => requireChatUploader(req, input.mid))
    .onUploadComplete(async ({ metadata, file }) => {
      const attachment = await mintChatAttachment({
        userId: metadata.userId,
        mid: metadata.mid,
        url: file.ufsUrl,
        name: file.name ?? null,
        type: file.type ?? null,
      });
      return { url: file.ufsUrl, name: file.name, type: file.type, attachment };
    }),
} satisfies FileRouter;

export type MobileFileRouter = typeof mobileFileRouter;
