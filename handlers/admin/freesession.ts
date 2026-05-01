import { freeSessionMeetingUrl, reserveFreeSession } from "@/data/freesession";
import { freeSessionSchemaType } from "@/schemas";
import { zencryption } from "@/utils/admin/encryption";
import { redirect } from "next/navigation";

export async function confirmFreeSession(data: freeSessionSchemaType) {
  // order
  const order = await reserveFreeSession(data);

  if (order?.state === false || !order?.message) return;

  // create google meeting
  await freeSessionMeetingUrl(Number(order?.message));

  // redirect
  if (order?.message)
    redirect("/freesessions/" + zencryption(Number(order?.message)));
}
