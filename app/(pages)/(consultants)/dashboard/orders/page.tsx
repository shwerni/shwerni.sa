// compenents
import OwnerOrderLayout from "@/components/legacy/consultants/owner/orders";
import WrongPage from "@/components/legacy/layout/zErrors/site/wrongPage";

// prisma data
import { getAllPaidOwnersOrdersByAuthor } from "@/data/order/reserveation";

// lib
import { timeZone } from "@/lib/site/time";
import { userServer } from "@/lib/auth/server";

export default async function OwnersOrders() {
  // user
  const user = await userServer();
  // author
  const author = user?.id ?? "";
  // orders
  const orders = await getAllPaidOwnersOrdersByAuthor(author);
  // today time zone
  const { date, time } = timeZone();
  // if not date
  if (!date) return <WrongPage />;
  // return
  return (
    <OwnerOrderLayout orders={orders} date={date} time={time} author={author} />
  );
}
