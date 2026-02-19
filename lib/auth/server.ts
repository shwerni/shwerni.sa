// auth
import { auth } from "@/auth";

// server components
export const userServer = async () => {
  // get session
  const session = await auth();

  //   return user
  return session?.user;
};

// server components
export const roleServer = async () => {
  // get session
  const session = await auth();

  //   return user role
  return session?.user.role;
};
