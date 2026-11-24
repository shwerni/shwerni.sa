// auth
import { auth } from "@/auth";

// prisma data
import { isWebLoginRevoked } from "@/data/account-state";

// server components. a website session is a jwt that can't be revoked, so a deleted (anonymized)
// account, or a login from before the last password change, is refused here
export const userServer = async () => {
  // get session
  const session = await auth();
  const user = session?.user;

  // a deleted account, or a login the password change ended, is signed out
  if (user?.id && (await isWebLoginRevoked(user.id, session?.authAt))) return undefined;

  //   return user
  return user;
};

// server components
export const roleServer = async () => {
  //   return user role (none for a deleted account or an ended login)
  return (await userServer())?.role;
};
