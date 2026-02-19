// React & Next
import Link from "next/link";

// components
import { Button } from "@/components/ui/button";
import Error404 from "@/components/shared/error-404";
import Section from "@/components/clients/shared/section";

// utils
import { zdencryption } from "@/utils/admin/encryption";

// prisma types
import {
  getReservationByOid,
  updateOrderStatus,
} from "@/data/order/reserveation";

// prisma types
import { PaymentState, PaymentMethod } from "@/lib/generated/prisma/client";

// icons
import { Home, X } from "lucide-react";

// props
interface Props {
  searchParams: {
    gateway?: string;
    id?: string;
    payment_id?: string;
  };
}

export default async function PaymentCancel({ searchParams }: Props) {
  // params
  const gateway = searchParams.gateway;

  // id (zid encrypted order id)
  const id = searchParams.id ?? searchParams.payment_id;

  // validate
  if (!id) return <Error404 />;

  // oid
  const oid = zdencryption(id);

  // validate
  if (!oid) return <Error404 />;

  // get order
  const response = await getReservationByOid(oid);

  // payment
  const payment = response?.payment;

  // validate
  if (response && payment?.pid) {
    // update status to failed
    await updateOrderStatus(payment.pid, PaymentState.REFUSED);
  }

  // return
  return (
    <Section>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        {/* failed */}
        <div className="flex flex-col items-center gap-6 my-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
              <X className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-3xl font-bold text-red-600">فشل الدفع</h3>
          </div>

          {/* رقم الطلب  */}
          <h4 className="max-w-xl text-lg text-muted-foreground leading-relaxed">
            {gateway === PaymentMethod.tabby
              ? `لقد ألغيت الدفع. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى.`
              : `تم إلغاء عملية الدفع الخاصة بالطلب رقم ${oid}`}
          </h4>
        </div>

        {/* navigate to main menu */}
        <Link href="/" className="mt-6">
          <Button className="gap-2 bg-zblue-200 hover:bg-zblue-300">
            <Home className="w-4 h-4" />
            الرجوع للصفحة الرئيسية
          </Button>
        </Link>
      </div>
    </Section>
  );
}
