"use client";
import React from "react";
import Image from "next/image";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/app/_components/layout/section";
import LoadingBtn from "@/app/_components/layout/loadingBtn";
import BackButton from "@/app/_components/layout/navigation/backButton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { Discount } from "@/lib/generated/prisma/client";

import { toggleDiscountState } from "@/data/discounts";

import { cn } from "@/lib/utils";

// types
interface Props {
  cid: number;
  discount: Discount;
  iStatus: boolean | undefined;
}

export default function DiscountConsultant({ cid, discount, iStatus }: Props) {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [status, setStatus] = React.useState<boolean>(iStatus ?? false);

  const onSubmit = async () => {
    // loading
    setLoading(true);
    try {
      // sent status
      await toggleDiscountState(discount.did, !status, cid);

      // status
      setStatus(!status);

      // toast
      toast.success("✅ تم التقديم بنجاح");

      // loading
      setLoading(false);
    } catch {
      // toast
      toast.error("❌ حدث خطأ");
      // loading
      setLoading(false);
    }
  };

  if (!discount) return <p className="p-6">جاري التحميل...</p>;

  return (
    <Section className="p-6 max-w-2xl space-y-5 mx-auto">
      <BackButton type="link" link="/dashboard/discounts" />
      <Card className="rounded-2xl shadow overflow-hidden">
        {/* 🔹 Image header */}
        {discount.image && (
          <div className="h-48 w-full relative">
            <Image
              src={discount.image}
              alt={discount.name}
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <CardTitle className="text-white text-2xl font-bold">
                {discount.name}
              </CardTitle>
            </div>
          </div>
        )}

        <CardHeader>
          {!discount.image && <CardTitle>{discount.name}</CardTitle>}
        </CardHeader>

        <CardContent className="space-y-4">
          <p>{discount.description}</p>

          <p>
            النوع: {discount.type === "PERCENT" ? "خصم نسبي" : "سعر ثابت"} |
            القيمة:{" "}
            {discount.type === "PERCENT"
              ? `${discount.discount}%`
              : `${discount.discount} ريال`}
          </p>

          <p>
            صالح من: {new Date(discount.startDate).toLocaleDateString("ar-EG")}{" "}
            → {new Date(discount.endDate).toLocaleDateString("ar-EG")}
          </p>

          <Button
            type="submit"
            className={cn([status ? "bg-red-600" : "bg-zblue-200", "w-full"])}
            onClick={onSubmit}
          >
            <LoadingBtn loading={loading}>
              {status ? "إلغاء التقديم" : "تقديم على الخصم"}
            </LoadingBtn>
          </Button>
        </CardContent>
      </Card>
    </Section>
  );
}
