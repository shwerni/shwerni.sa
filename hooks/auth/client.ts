// auth
import { useSession } from "next-auth/react";

// use current signed user in client components
export const useUserClient = () => {
  // get session
  const session = useSession();

  // return user
  return session.data?.user;
};

// use current signed user in client components
export const useRoleClient = () => {
  // get session
  const session = useSession();

  // return user
  return session.data?.user.role;
};
