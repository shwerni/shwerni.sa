// packages
import { UploadThingError } from "uploadthing/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

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
  // chat
  chatAttachment: f({
    image: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "16MB" },
  })
    .middleware(async () => {
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl, name: file.name, type: file.type };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
