import CardSkeleton from "@/components/clients/shared/card-skeleton";
import { OrderFilters } from "@/components/clients/user/order";
import { OrderTable } from "@/components/clients/user/table";
import Error404 from "@/components/shared/error-404";
import { getUserOrders } from "@/data/user";
import { userServer } from "@/lib/auth/server";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{
    type?: "upcoming" | "past";
    payment?: string;
  }>;
}

export default async function Page({ searchParams }: Props) {
  const { type, payment } = await searchParams;
  const user = await userServer();

  // validate
  if (!user) return <Error404 />;

  const orders = await getUserOrders({
    userId: user?.id,
    type: type,
    paymentState: payment,
  });

  return (
    <div className="p-6">
      <Suspense
        fallback={<CardSkeleton count={6} className="grid grid-cols-3" />}
      >
        <OrderFilters />
        <OrderTable orders={orders} />
      </Suspense>
    </div>
  );
}
