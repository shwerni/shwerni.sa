// auth
import { auth } from "@/auth";

// prisma data
import { isAccountDeleted } from "@/data/account-state";

// server components. a deleted (anonymized) account has no session: its jwt can't be revoked,
// so it's refused here
export const userServer = async () => {
  // get session
  const session = await auth();
  const user = session?.user;

  // a deleted account is signed out
  if (user?.id && (await isAccountDeleted(user.id))) return undefined;

  //   return user
  return user;
};

// server components
export const roleServer = async () => {
  //   return user role (none for a deleted account)
  return (await userServer())?.role;
};
