"use server";

// Next
import { redirect } from "next/navigation";

// prisma data
import { freeSessionMeetingUrl, reserveFreeSession } from "@/data/freesession";

// schemas
import { freeSessionSchemaType } from "@/schemas";

// utils
import { zencryption } from "@/utils/admin/encryption";

// normal free session
export async function confirmFreeSession(data: freeSessionSchemaType) {
  // order
  const order = await reserveFreeSession(data);

  // validate
  if (!order || order.state === false || !order.message) return;

  // session id
  const fid = Number(order.message);

  // create google meeting
  await freeSessionMeetingUrl(fid);

  // redirect
  redirect("/freesessions/" + zencryption(fid));
}