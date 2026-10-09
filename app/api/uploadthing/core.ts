// packages
import { z } from "zod";
import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

// prisma data
import { getMeetingAccess } from "@/data/chats";
import { getPleadingAccess } from "@/data/pleading";

// hooks
import { userServer } from "@/lib/auth/server";

// lib
import { rateLimit } from "@/lib/rate-limit";

// prisma types
import { PleadingState, UserRole } from "@/lib/generated/prisma/enums";

// utils
import {
  clientTokenSchema,
  DOCX_MIME,
  isPleadingChatOpen,
} from "@/utils/pleading";

// config
const f = createUploadthing();

// fileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "8MB" } })
    // set permissions and file types for this FileRoute
    .middleware(async () => {
      const user = await userServer();
      if (!user?.id) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      // this code RUNS ON YOUR SERVER after upload
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
  pdfUploader: f({ pdf: { maxFileSize: "16MB" } })
    // set permissions and file types for this FileRoute
    .middleware(async () => {
      const user = await userServer();
      if (!user?.id) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata }) => {
      // this code RUNS ON YOUR SERVER after upload
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId };
    }),
  // chat: open to guests (chat links work without login), so types, size and count stay tight
  chatAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    // same rule as the chat route: the uploader must hold a participant token of this meeting
    .input(z.object({ mid: z.string().min(1), participant: z.string().min(1) }))
    .middleware(async ({ input }) => {
      const access = await getMeetingAccess(input.mid);
      const isParticipant = !!access?.participants.some(
        (p) => p.participant === input.participant,
      );
      if (!isParticipant) throw new UploadThingError("Unauthorized");
      return { mid: input.mid };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl, name: file.name, type: file.type };
    }),
  // pleading case: open to guests like the chat, with the same types and sizes. the client
  // sends their link token, the consultant uses their session; either must own this case
  pleadingAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    // word (.docx) for case documents; uploadthing checks the type against this list on the server
    [DOCX_MIME]: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .input(
      z.object({
        plid: z.number().int().positive(),
        token: z.string().optional(),
      }),
    )
    .middleware(async ({ input }) => {
      let access = null;
      if (input.token) {
        if (clientTokenSchema.safeParse(input.token).success)
          access = await getPleadingAccess({ token: input.token });
      } else {
        const user = await userServer();
        if (user?.id && user.role === UserRole.OWNER)
          access = await getPleadingAccess({ plid: input.plid, userId: user.id });
      }

      // the case must be this one, and still writable: open, or the client's own DRAFT
      // (the request form's files)
      const writable =
        !!access &&
        access.pleading.plid === input.plid &&
        (isPleadingChatOpen(access.pleading.state) ||
          (access.role === UserRole.USER &&
            access.pleading.state === PleadingState.DRAFT));
      if (!writable) throw new UploadThingError("Unauthorized");

      // per case, so a link can't be used to store files without limit
      if (
        !(await rateLimit(`pleading.upload:${input.plid}`, {
          limit: 20,
          window: "1 h",
        }))
      )
        throw new UploadThingError("Too many uploads");

      return { plid: input.plid };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl, name: file.name, type: file.type };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
