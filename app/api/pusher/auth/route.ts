import { pusherServer } from "@/lib/api/pusher/pusher-server";
import prisma from "@/lib/database/db";
import { userServer } from "@/lib/auth/server";

export async function POST(req: Request) {
  const formData = await req.formData();
  const socket_id = formData.get("socket_id") as string;
  const channel_name = formData.get("channel_name") as string;

  // the user comes from the session; the userId form field is ignored
  const user = await userServer();
  const userId = user?.id;

  if (!socket_id || !channel_name || !userId)
    return new Response("Unauthorized", { status: 403 });

  if (channel_name !== "presence-consultants")
    return new Response("Forbidden", { status: 403 });

  const consultant = await prisma.consultant.findUnique({
    where: { userId },
    select: { userId: true },
  });

  if (!consultant) return new Response("Forbidden", { status: 403 });

  const auth = pusherServer.authorizeChannel(socket_id, channel_name, {
    user_id: userId,
    user_info: { id: consultant.userId },
  });

  return Response.json(auth);
}
