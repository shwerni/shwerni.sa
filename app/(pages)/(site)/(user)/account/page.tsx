// components
import Error404 from "@/components/shared/error-404";
import UserAccount from "@/components/clients/user/account";

// lib
import { userServer } from "@/lib/auth/server";

const Page = async () => {
  // user
  const user = await userServer();

  // validate
  if (!user) return <Error404 />;

  return <UserAccount user={user} />;
};

export default Page;
