// components
import LogOut from "@/components/auth/logout";

// auth
import { userServer } from "@/lib/auth/server";

export default async function Page() {
  // auth
  const user = await userServer();

  return <LogOut user={user} />;
}
