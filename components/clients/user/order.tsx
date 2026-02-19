"use client";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { PaymentState } from "@/lib/generated/prisma/enums";
import { findPayment } from "@/utils";
import { useQueryState } from "nuqs";

export function OrderFilters() {
  const [type, setType] = useQueryState("type", {
    defaultValue: "upcoming",
    shallow: false,
  });

  const [payment, setPayment] = useQueryState("payment", {
    shallow: false,
  });

  return (
    <div className="flex max-w-sm gap-3 mb-6">
      {/* Upcoming / Past */}
      <Select value={type ?? ""} onValueChange={(value) => setType(value)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="تاريخ الطلب" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="upcoming">القادمة</SelectItem>
            <SelectItem value="past">السابقة</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Payment State */}
      <Select
        value={payment ?? ""}
        onValueChange={(value) => setPayment(value)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="حاله الطلب" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">الكل</SelectItem>
            {Object.values(PaymentState).map((state) => (
              <SelectItem key={state} value={state}>
                {findPayment(state)?.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
