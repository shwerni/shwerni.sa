// packages
import { z } from "zod";
import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

// prisma data
import { getMeetingAccess } from "@/data/chats";

// hooks
import { userServer } from "@/lib/auth/server";

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
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
