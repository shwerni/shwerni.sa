// React & Next
import Link from "next/link";
import { redirect } from "next/navigation";

// components
import NavLinks from "@/components/shared/links";
import Error404 from "@/components/shared/error-404";
import CopyButton from "@/components/shared/copy-button";
import Section from "@/components/clients/shared/section";
import OrderTable from "@/components/clients/shared/order-table";
import { LinkButton } from "@/components/shared/link-button";

// utils
import { zdencryption } from "@/utils/admin/encryption";

// prisma data
import { getReservationByOid } from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";

// types
import { Reservation } from "@/types/admin";

// constant
import { mainRoute } from "@/constants/links";

// icons
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Home,
  ReceiptText,
  Video,
} from "lucide-react";

// props
type Props = {
  searchParams: Promise<{
    id?: string;
    status?: string;
  }>;
};

export default async function PaymentSuccess({ searchParams }: Props) {
  // params
  const { id: zid, status } = await searchParams;

  // meeting url
  const url = `${mainRoute}/meetings/${zid}?participant=client&session=1`;

  // validate
  if (!zid) return <Error404 />;

  // oid
  const oid = zdencryption(zid);

  // validate
  if (!oid) return <Error404 />;

  // order
  const order: Reservation | null = await getReservationByOid(oid);

  // validate
  if (!order?.payment) return <Error404 />;

  const payment = order.payment;

  // validate success state
  if (!(status === "paid" && payment.payment === PaymentState.PAID))
    redirect(`/payment/failed?id=${zid}`);

  // return
  return (
    <Section className="my-5 py-5 px-3 max-w-xl mx-auto">
      <div className="space-y-6">
        {/* success Header */}
        <div className="flex flex-col items-center gap-3 pt-4 pb-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
            <CircleCheck className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-600">تم الدفع بنجاح</h1>
          <p className="text-sm text-gray-600">
            تم تأكيد حجزك ومعالجة الدفع بنجاح
          </p>
        </div>

        {/* order detials */}
        <OrderTable order={order} />
      </div>

      <div className="p-5 rounded-xl border border-border space-y-3">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CircleAlert className="h-4 w-4 text-amber-500" />
          <span>برجاء الاحتفاظ برابط الاجتماع</span>
        </div>
        <div className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <Video className="h-4 w-4 shrink-0 text-theme" />
            <Link href={url} className="flex-1 inline-flex justify-center">
              <span className="truncate text-xs font-mono text-gray-800">
                {mainRoute}/meetings/{zid}
              </span>
            </Link>
        </div>
        <div className="flex justify-center">
          <CopyButton label="نسخ رابط الاجتماع" value={url} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <LinkButton className="gap-2" href="/" variant="primary">
          <Home className="h-4 w-4" />
          الرجوع للصفحة الرئيسية
        </LinkButton>
        <LinkButton
          href="/privacy"
          variant="ghost"
          className="gap-2 text-xs text-muted-foreground transition hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          الشروط والاحكام وسياسة الاسترجاع
          <ReceiptText className="h-3.5 w-3.5" />
        </LinkButton>
      </div>

      {/* Bottom Nav */}
      <NavLinks className="w-fit mx-auto" />
    </Section>
  );
}
