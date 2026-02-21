import { reserveFreeSession } from "@/data/freesession";
import { freeSessionSchemaType } from "@/schemas";
import { zencryption } from "@/utils/admin/encryption";
import { redirect } from "next/navigation";

export async function confirmFreeSession(data: freeSessionSchemaType) {
  // order
  const order = await reserveFreeSession(data);

  if (order?.state === false) return;

  // redirect
  if (order?.message)
    redirect("/freesessions/" + zencryption(Number(order?.message)));
}
