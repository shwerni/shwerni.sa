"use server";
// components
import EmployeeOrderForm from "@/app/_components/management/layout/orders/form";
import { ZSection } from "@/app/_components/layout/section";

// utils
import { findUser } from "@/utils";

// types
import { Reservation } from "@/types/admin";

// auth types
import { User } from "next-auth";

// utils
import { dateTimeToString } from "@/utils/moment";

// icons
import { ChevronLeftIcon, ChevronRightIcon, ExternalLink } from "lucide-react";

// props
interface Props {
  order: Reservation;
  commission: number | undefined;
  tax: number | undefined;
  user: User;
  lang?: "en" | "ar";
}

export default async function EmployeeEditOrder({
  user,
  order,
  commission,
  tax,
  lang,
}: Props) {
  // check langauge
  const isEn = !lang || lang === "en";
  // payment
  const payment = order.payment;
  // return
  return (
    <ZSection>
      <div
        className="max-w-4xl sm:w-10/12 mx-auto space-y-10"
        dir={isEn ? "ltr" : "rtl"}
      >
        <a
          href={`${findUser(user.role)?.url}/orders`}
          className="flex flex-row gap-1 items-center w-fit"
        >
          {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          <h5 className="pt-1">{isEn ? "orders" : "الرجوع للطلبات"}</h5>
        </a>
        <div className="w-10/12 mx-auto space-y-10">
          <div>
            <h3 className="text-lg capitalize">
              {isEn ? "edit order " : "تعديل الطلب "}#{order?.oid}
            </h3>
            {order.created_at && (
              <h6 className="text-xs font-medium">
                {dateTimeToString(order.created_at)}
              </h6>
            )}
          </div>
          {/* order form */}
          <EmployeeOrderForm
            variant="edit"
            user={user}
            order={order}
            tax={tax}
            commission={commission}
            lang={lang}
          />
          {/* meetings */}
          <div className="space-y-3">
            <h6>{isEn ? "meetings" : "الاجتماعات"}</h6>
            <ol className="flex flex-col w-10/12 mx-auto space-y-3 list-decimal">
              {
                order.meeting?.map((i, index) => (
                  <li key={index}>
                    <span className="inline-flex gap-2">
                      <a href={`${findUser(user.role)?.url}/meetings/${order.oid}?session=${i.session}`} target="_blank">
                        {i.date} | {i.time}
                      </a>
                      <ExternalLink className="w-3" />
                    </span>
                  </li>
                ))
              }
            </ol>
          </div>
          {/* order info */}
          <div className="my-5 space-y-2">
            <h5 className="text-sm">
              {isEn ? "orders' info" : "معلومات الطلب"}
            </h5>
            {/* info */}
            <div className="w-10/12 mx-auto">
              <ul className="space-y-4 list-disc">
                {/* gift */}
                {
                  order.gift && order.guest &&
                  (<li>
                    {isEn ? `gift from ${order.guest.name} | ${order.guest.phone}` : `هذه الجلسة هدية من ${order.guest.name} | ${order.guest.phone}`}
                  </li>)
                }
                {/* program */}
                {order.programId && order.program && (
                  <li>
                    {isEn ? `prgoram ${order.program.title} #${order.programId}` : `برنامج ${order.program.title} #${order.programId}`}
                  </li>
                )}
                {/* order payment details */}
                {payment?.paid && (
                  <li>
                    {isEn ? "paid" : "تم دفع"} - {payment?.paid}{" "}
                    {isEn ? "sar" : "ريال"}
                  </li>
                )}
                {payment?.usedCoupon && (
                  <li>
                    {isEn ? "coupon" : "كوبون"} - {payment?.usedCoupon.code}
                    {" | "}
                    {payment?.usedCoupon.discount}%
                  </li>
                )}
                {payment?.wallet && (
                  <li>
                    {isEn ? "wallet - pay" : "دفع بالمحفظة"}: {payment?.wallet}
                  </li>
                )}
                {/* order histoy details */}
                {order.info.map((i, index) => (
                  <li key={index} className="text-sm">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </ZSection>
  );
}
