"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import NewOrder from "@/app/_components/management/layout/orders/newOrder";

// hooks
import { userServer } from "@/lib/auth/server";

// prisma data
import { getTaxCommission } from "@/data/admin/settings/finance";

export default async function Page() {
  // get tax & commisiison
  const taxCommission = await getTaxCommission();

  // user
  const user = await userServer();

  // if not exist
  if (!user || !taxCommission) return <WrongPage />;
  // return
  return (
    <NewOrder
      user={user}
      tax={taxCommission.tax ?? undefined}
      commission={taxCommission?.commission ?? undefined}
    />
  );
}
