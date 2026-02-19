// React & Next
import React from "react";

// components
import { ConfrimBtnAdmin } from "@/app/_components/management/layout/confirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast as sonner } from "sonner";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// prisma data
import { bulkStatusOrderAdmin } from "@/data/admin/order";

// utils
import { findPayment } from "@/utils";

// constants
import { paymentStatuses } from "@/constants/admin";

// props
interface Props {
  oids: number[];
  lang?: "en" | "ar";
}

export default function BulkOrderStatus({ oids, lang }: Props) {
  // check lang
  const isEn = lang === "en" || !lang;
  // new state
  const [status, setStatus] = React.useState<PaymentState | null>(null);
  // bulk action
  async function bulkAction() {
    try {
      if (status) {
        await bulkStatusOrderAdmin(oids, status);
      }
      return true;
    } catch {
      return null;
    }
  }

  // return
  return (
    <div className="w-fit my-3" dir={isEn ? "ltr" : "rtl"}>
      <Label className="text-zgrey-100">
        {isEn ? "bulk action" : "إجراء جماعي"}
      </Label>
      <div className="rflex">
        <div>
          <Select onValueChange={(value) => setStatus(value as PaymentState)}>
            <SelectTrigger className="w-28 lowercase">
              <SelectValue placeholder={isEn ? "status" : "حالة الطلب"} />
            </SelectTrigger>
            <SelectContent>
              {paymentStatuses.map((i, index) => (
                <SelectItem key={index} value={i.state} className="lowercase">
                  {isEn ? i.state : findPayment(i.state)?.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* confrim */}
        <ConfrimBtnAdmin
          onConfirm={bulkAction}
          onSuccess={() => {
            // toast
            sonner.success(
              isEn
                ? "orders status has been changed successfully"
                : "تم تغيير حالة الطلبات بنجاح",
            );
            // refresh the page
            window.location.reload();
          }}
          onFailure={() => {
            sonner.error(isEn ? "error occured" : "حدث خطأ ما");
          }}
          item={isEn ? "order" : "الطلب"}
          lang={lang}
        />
      </div>
    </div>
  );
}
