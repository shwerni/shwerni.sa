// get data
import Discover from "@/components/clients/discover/discover";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// auth
import { userServer } from "@/lib/auth/server";

const Page = async () => {
  // user
  const user = await userServer();

  // get finance
  const finance = await getFinanceConfig();

  return <Discover user={user} finance={finance}/>;
};

export default Page;
