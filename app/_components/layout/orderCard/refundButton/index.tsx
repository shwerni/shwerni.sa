// React & Next
import React from "react";

// packages
import moment from "moment";

// compoennt
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZToast } from "@/app/_components/layout/toasts";
import LoadingBtn from "@/app/_components/layout/loadingBtn";

// utils
import { findTime, totalAfterTax } from "@/utils";

// prisma data
import { orderStatusRefund } from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// types
import { DateTime } from "@/types/types";
import { Reservation } from "@/types/admin";

// props
interface Props {
  time: DateTime;
  order: Reservation;
}

// return
export default function RefundBtn({ time, order }: Props) {
  // open
  const [isOpen, setIsOpen] = React.useState(false);

  // sending
  const [isSending, startSending] = React.useTransition();

  // is still can refund
  const isRefundAble =
    order.meeting &&
    order.payment &&
    CheckHours(time, {
      date: order.meeting[0].date,
      time: order.meeting[0].time,
    }) &&
    order.payment.payment === PaymentState.PAID;

  // close dialog
  function closeModal() {
    if (!isSending) {
      setIsOpen(false);
    }
  }

  // open dialog
  function openModal(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsOpen(true);
  }

  // onSubmit
  function onSubmit() {
    startSending(() => {
      if (order.payment?.pid)
        orderStatusRefund(order.payment.pid).then((response) => {
          if (response) {
            // sucess
            ZToast({ state: true, message: "تم استرداد المبلغ بنجاح" });
            // relaod page
            window.location.reload();
          } else {
            // failed
            ZToast({ state: false, message: "حدث خطأ ما" });
          }
        });
    });
  }

  // return
  if (order.payment && order.meeting)
    return (
      isRefundAble && (
        <React.Fragment>
          <div onClick={openModal} className="cflex">
            <Button
              className="zgreyBtn gap-2 text-sm h-fit py-1"
              disabled={isSending}
              type="submit"
            >
              <LoadingBtn loading={isSending}>الفاء</LoadingBtn>
            </Button>
          </div>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="bg-zblue-100 max-w-md" dir="rtl">
              <DialogHeader className="items-start text-right">
                <DialogTitle className="ar text-2xl font-bold text-zblue-200">
                  إلغاء الحجز
                </DialogTitle>
              </DialogHeader>

              {!order ? (
                <h3 className="my-2 mx-4">جاري التحميل</h3>
              ) : (
                <div className="space-y-2 my-2 text-right">
                  <div className="flex flex-col items-start">
                    <h3>سيتم إلغاء الحجز رقم #{order.oid}</h3>
                    <p>سيتم إلغاء الحجز و سيتم استرداد المبلغ الي المحفظة</p>
                  </div>

                  <ul className="flex flex-col items-start mx-3 list-disc">
                    <li>المستشار: {order.consultant.name}</li>
                    <li>
                      اجمالي المبلغ:{" "}
                      {totalAfterTax(order.payment.total, order.payment.tax)}{" "}
                      ر.س
                    </li>
                    <li>
                      الموعد يوم {order.meeting[0].date} الساعة{" "}
                      {findTime(order.meeting[0].time)?.label}
                    </li>
                    <li>المدة: {order.meeting[0].duration} دقيقة</li>
                  </ul>

                  <DialogFooter className="flex flex-row justify-end gap-3">
                    <Button
                      onClick={onSubmit}
                      className="gap-2 bg-zgrey-100 rounded-2xl"
                      disabled={isSending}
                    >
                      <LoadingBtn loading={isSending}>
                        تاكيد إلغاء الحجز
                      </LoadingBtn>
                    </Button>
                    <Button
                      className="bg-red-500 rounded-2xl"
                      onClick={closeModal}
                    >
                      غلق
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </React.Fragment>
      )
    );
}

// Check if more than 6 hours ahead
function CheckHours(now: DateTime, order: DateTime) {
  // compare dates and time
  const meeting = moment(`${order.date} ${order.time}`, "YYYY-MM-DD HH:mm");
  const timeNow = moment(`${now.date} ${now.time}`, "YYYY-MM-DD HH:mm");
  // check 6 hours difference
  const diff = meeting.diff(timeNow, "hours");

  // refund able (still)
  if (diff >= 6) return true;

  // not refund able (expired)
  return false;
}
