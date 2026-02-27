import { pusherServer } from "@/lib/api/pusher/pusher-server";
import prisma from "@/lib/database/db";

export async function POST(req: Request) {
  const formData = await req.formData();
  const socket_id = formData.get("socket_id") as string;
  const channel_name = formData.get("channel_name") as string;
  const userId = formData.get("userId") as string;

  if (!socket_id || !channel_name || !userId) {
    return new Response("Unauthorized", { status: 403 });
  }

  // Guests never reach this point. Only the dashboard connects here.
  if (channel_name !== "presence-consultants") {
    return new Response("Forbidden", { status: 403 });
  }

  const consultant = await prisma.consultant.findUnique({
    where: { userId },
    select: { id: true }, // Absolute minimal select, just to verify they exist
  });

  if (!consultant) return new Response("Forbidden", { status: 403 });

  const auth = pusherServer.authorizeChannel(socket_id, channel_name, {
    user_id: userId,
    user_info: { id: consultant.id },
  });

  return Response.json(auth);
}