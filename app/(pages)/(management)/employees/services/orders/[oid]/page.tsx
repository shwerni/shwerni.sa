"use server";
// components
import EmployeeEditOrder from "@/app/_components/management/layout/orders/editOrder";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// prisma data
import { getTaxCommission } from "@/data/admin/settings/finance";
import { getReservationByOid } from "@/data/order/reserveation";

// hooks
import { userServer } from "@/lib/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ oid: string }>;
}) {
  // oid
  const { oid } = await params;

  // get orders
  const order = await getReservationByOid(Number(oid));
  // get tax & commisiison
  const taxCommission = await getTaxCommission();
  // user
  const user = await userServer();
  // if not exist
  if (!order || !user) return <WrongPage />;
  // return
  return (
    <EmployeeEditOrder
      user={user}
      order={order}
      tax={taxCommission?.tax ?? undefined}
      commission={taxCommission?.commission ?? undefined}
      lang="ar"
    />
  );
}
