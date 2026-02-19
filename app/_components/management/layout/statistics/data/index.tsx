"use client";
// React & Next
import React from "react";

// components
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";

// utils
import { isEnglish } from "@/utils";

// types
import { Lang } from "@/types/types";

// icons
import { CircleCheckBig, User, X } from "lucide-react";

// types
// order statisics type
interface OwnersStatistics {
  owners: number;
  approved: number;
  published: number;
  family: {
    all: number;
    published: number;
  };
  law: {
    all: number;
    published: number;
  };
  // medicine: {
  //   all: number;
  //   published: number;
  // };
  psychic: {
    all: number;
    published: number;
  };
}

// order statisics type
interface OrdersStatistics {
  orders: number;
  paid: number;
  refund: number;
}

// props
interface Props {
  users: number | undefined;
  orders: OrdersStatistics | undefined;
  owners: OwnersStatistics | undefined;
  lang?: Lang;
}

export default function StatisticsData({ users, orders, owners, lang }: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // statistics card
  const StatisticsCard = (
    label: string,
    value: number | undefined,
    Icon?: React.ReactNode | string
  ) => {
    return (
      <Card className="cflex w-fit min-w-24 px-2 sm:px-3 py-2 gap-1">
        <div className="rflex gap-3">
          <h3 className="pt-1">{value}</h3>
          {Icon}
        </div>
        <h6 className="text-center">{label}</h6>
      </Card>
    );
  };

  const OwnersCard = (
    category: string,
    value: number | undefined,
    published: number | undefined
  ) => {
    return (
      <Card className="cflex px-2 sm:px-3 py-2 gap-1 max-w-32">
        <div className="cflex gap-2">
          <div className="rflex gap-2">
            <h3>{isEn ? "all" : "الكل"}</h3>
            <h3>{value}</h3>
          </div>
          <div className="rflex gap-2">
            <CircleCheckBig className="w-5 text-green-500" />
            <h3>{published}</h3>
          </div>
        </div>
        <h6 className="text-center">{category}</h6>
      </Card>
    );
  };

  // return
  return (
    <>
      {/* owners */}
      <div className="space-y-5">
        <div className="space-y-2">
          <h3>{isEn ? "consultants" : "المستشارون"}</h3>
          <div className="flex items-center gap-2 sm:mx-3">
            {StatisticsCard(isEn ? "all" : "الكل", owners?.owners)}
            {StatisticsCard(isEn ? "approved" : "مقبول", owners?.approved)}
            {StatisticsCard(isEn ? "published" : "منشور", owners?.published)}
          </div>
        </div>
        <div className="space-y-2">
          <h3>{isEn ? "categories" : "الفئات"}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-5">
            {OwnersCard(
              isEn ? "family" : "اسري",
              owners?.family.all,
              owners?.family.published
            )}
            {OwnersCard(
              isEn ? "psychic" : "نفسي",
              owners?.psychic.all,
              owners?.psychic.published
            )}
            {OwnersCard(
              isEn ? "law" : "قانون",
              owners?.law.all,
              owners?.law.published
            )}
            {/* {OwnersCard(
              isEn ? "medicine" : "طب",
              owners?.medicine.all,
              owners?.medicine.published
            )} */}
          </div>
        </div>
      </div>
      {/* separator */}
      <Separator className="w-3/4 mx-auto my-2" />
      {/* users */}
      <div className="space-y-2">
        <h3>{isEn ? "users" : "المستخدمين"}</h3>
        <div className="flex gap-3 mx-3">
          {StatisticsCard(isEn ? "all" : "الكل", users, <User />)}
          {StatisticsCard(
            isEn ? "clients" : "العملاء",
            owners?.owners && users ? users - owners?.owners : users,
            <User />
          )}
          {StatisticsCard(
            isEn ? "owners" : "المستشارون",
            owners?.owners && owners?.owners,
            <User />
          )}
        </div>
      </div>
      {/* separator */}
      <Separator className="w-3/4 mx-auto my-2" />
      {/* orders */}
      <div className="space-y-2">
        <h3>{isEn ? "orders" : "الطلبات"}</h3>
        <div className="flex items-center gap-2 sm:mx-3">
          {StatisticsCard(isEn ? "all" : "الكل", orders?.orders)}
          {StatisticsCard(
            isEn ? "paid" : "المدفوع",
            orders?.paid,
            <CircleCheckBig className="w-5 text-green-500" />
          )}
          {StatisticsCard(
            isEn ? "refund" : "المرتجع",
            orders?.refund,
            <X className="w-5 text-red-500" />
          )}
        </div>
      </div>
      {/* separator */}
      <Separator className="w-3/4 mx-auto my-2" />
    </>
  );
}
