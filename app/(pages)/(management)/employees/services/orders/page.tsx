"use server";
// React & Next
import React from "react";

// components
import  EmployeeOrders  from "@/app/_components/management/layout/orders";

// primsa data
import { getOrdersForManagments } from "@/data/admin/order";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

export default async function Page() {
  // get orders
  const orders = await getOrdersForManagments(1, "") ?? [];

  // return
  return <EmployeeOrders iOrders={orders.orders} iTotalCount={orders.totalCount} role={UserRole.SERVICE} lang="ar"/>;
}
