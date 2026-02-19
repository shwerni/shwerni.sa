"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// prisma data
import { getAllCoupons } from "@/data/admin/coupon";

export default async function Page() {
  // get meetings
  const coupons = await getAllCoupons();

  // if not exist
  if (!coupons) return <WrongPage />;

  // return
  return;
}
