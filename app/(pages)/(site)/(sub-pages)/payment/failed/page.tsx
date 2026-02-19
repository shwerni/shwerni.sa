// React & Next
import Link from "next/link";

// components
import { Button } from "@/components/ui/button";
import Error404 from "@/components/shared/error-404";
import Section from "@/components/clients/shared/section";

// utils
import { zdencryption } from "@/utils/admin/encryption";

// prisma data
import {
  getReservationByOid,
  updateOrderStatus,
} from "@/data/order/reserveation";

// prisma types
import { PaymentState, PaymentMethod } from "@/lib/generated/prisma/client";

// icons
import { Home, X } from "lucide-react";
import NavLinks from "@/components/shared/links";

// props
type Props = {
  searchParams: Promise<{
    id?: string;
    gateway?: string;
    status?: string;
    message?: string;
    invoice_id?: string;
    payment_id?: string;
  }>;
};

export default async function PaymentFailed({ searchParams }: Props) {
  // url params
  const { id, gateway } = await searchParams;

  // validate
  if (!id) return <Error404 />;

  // order zid
  const oid = zdencryption(id);

  // validate
  if (!oid) return <Error404 />;

  // order
  const order = await getReservationByOid(oid);

  // validate
  if (!order?.payment?.pid) return <Error404 />;

  // payment
  const payment = order.payment;

  // update status to failed (idempotent)
  if (payment.payment !== PaymentState.PAID && payment?.pid)
    await updateOrderStatus(payment?.pid, PaymentState.REFUSED);

  // return
  return (
    <Section className="flex flex-col items-center justify-center min-h-[65vh] px-4 text-center space-y-5">
      {/* failed */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center w-24 h-24 rounded-full bg-red-100">
          <X className="w-12 h-12 text-red-500" />
        </div>

        <h3 className="text-3xl font-bold text-red-600">فشل الدفع</h3>

        {/* رقم الطلب  */}
        <h4 className="max-w-xl text-lg text-muted-foreground leading-relaxed">
          {gateway === PaymentMethod.tabby
            ? `نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى. رقم الطلب ${oid}`
            : `فشلت عملية الدفع الخاصة بالطلب رقم ${oid}`}
        </h4>
      </div>

      {/* navigate to main menu */}
      <Link href="/">
        <Button className="gap-2" variant="primary">
          <Home className="w-4 h-4" />
          الرجوع للصفحة الرئيسية
        </Button>
      </Link>

      {/* nav links */}
      <NavLinks />
    </Section>
  );
}
