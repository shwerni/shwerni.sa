import { notFound } from "next/navigation";
import { userServer } from "@/lib/auth/server";
import ChatListClient from "@/components/clients/chats/list/list";

export default async function ClientChatsPage() {
  const user = await userServer();

  if (!user?.role || !user.id) notFound();

  return <ChatListClient author={user.id} role={user.role} />;
}
