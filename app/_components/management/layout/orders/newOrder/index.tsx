"use server";
// React & Next
import React from "react";

// components
import { ZSection } from "@/app/_components/layout/section";
import EmployeeOrderForm from "@/app/_components/management/layout/orders/form";

// utils
import { findUser } from "@/utils";

// auth types
import { User } from "next-auth";

// icons
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// props
interface Props {
  user: User;
  tax: number | undefined;
  commission: number | undefined;
  lang?: "en" | "ar";
}

export default async function NewOrder({ user, tax, commission, lang }: Props) {
  // check langauge
  const isEn = !lang || lang === "en";
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
          <h3 className="text-lg capitalize">
            {isEn ? "create new order" : "إنشاء طلب جديد"}
          </h3>
          <EmployeeOrderForm
            variant="new"
            order={null}
            tax={tax}
            commission={commission}
            lang={lang}
            user={user}
          />
        </div>
      </div>
    </ZSection>
  );
}
