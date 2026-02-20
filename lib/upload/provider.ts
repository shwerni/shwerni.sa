import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

export const uploadThingRouterConfig =
  extractRouterConfig(ourFileRouter);