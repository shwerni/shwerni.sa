// React & Next
import Link from "next/link";
import { redirect } from "next/navigation";

// components
import NavLinks from "@/components/shared/links";
import Error404 from "@/components/shared/error-404";
import CopyButton from "@/components/shared/copy-button";
import Section from "@/components/clients/shared/section";
import { LinkButton } from "@/components/shared/link-button";
import OrderTable from "@/components/clients/shared/order-table";

// utils
import { zencryption } from "@/utils/admin/encryption";

// prisma data
import { getReservationByPid } from "@/data/order/reserveation";

// prisma types
import { OrderType } from "@/lib/generated/prisma/enums";

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
    gateway?: string;
    status?: string;
    message?: string;
    invoice_id?: string;
    payment_id?: string;
  }>;
};

export default async function PaymentSuccess({ searchParams }: Props) {
  // url params
  const { id, status, message, invoice_id, payment_id } = await searchParams;

  // pid
  const pid = id ? invoice_id : payment_id;

  // if pid not exist
  if (!pid) return <Error404 />;

  // get order by payment id
  const order = await getReservationByPid(pid);

  // wrong page
  if (!order) return <Error404 />;
  
  // zid
  const zid = zencryption(order.oid);

  // meeting url
  const url = `${mainRoute}/meetings/${zid}?participant=client&session=1`;

  // payment
  const payment = order.payment;

  // wrong page
  if (!payment || !payment.id) return <Error404 />;

  // redirect if INSTANT order
  if (order.type === OrderType.INSTANT) {
    redirect(
      `${mainRoute}meetings/${zencryption(order.oid)}?participant=client&session=1`,
    );
  }

  // validate success for other types
  const success =
    payment_id ||
    (id && status === "paid" && message === "APPROVED" && invoice_id);

  // redirect to failed
  if (!success) redirect(`payment/failed?id=${payment.pid}`);

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
