"use server";
// components
import { ALLOrders } from "@/app/_components/management/admin/orders";

// prisma data
import { getAllOrdersDescAdmin } from "@/data/admin/order";

export default async function Page() {
  // get orders
  const orders = await getAllOrdersDescAdmin();

  // return
  return <ALLOrders orders={orders} />;
}
