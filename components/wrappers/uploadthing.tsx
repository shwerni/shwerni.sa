"use client";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";

export default function UploadThingProvider() {
  return (
    <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
  );
}