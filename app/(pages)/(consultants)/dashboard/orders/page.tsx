// compenents
import OwnerOrderLayout from "@/app/_components/consultants/owner/orders";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

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
  const { date, time } = await timeZone();
  // if not date
  if (!date) return <WrongPage />;
  // return
  return (
    <OwnerOrderLayout orders={orders} date={date} time={time} author={author} />
  );
}
