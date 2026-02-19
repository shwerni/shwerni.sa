"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAfter, isSameDay, parseISO } from "date-fns";

// components
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ZToast } from "@/app/_components/layout/toasts";
import LoadingBtn from "@/app/_components/layout/loadingBtn";
import { DatePicker } from "@/app/_components/management/layout/datePicker";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// lib
import { timeZone } from "@/lib/site/time";

// prisma data
import { createConsultantsCoupon } from "@/data/coupon";

// utils
import { cn } from "@/lib/utils";

// schema
import { couponConsultantSchema } from "@/schemas/consultant";

// props
interface Props {
  cid: number;
}

//  separator component
const SeparatorA = () => {
  return <Separator className="w-10/12 max-w-xl mx-auto" />;
};

export default function ConsultantCoupons({ cid }: Props) {
  // date
  const { date, iso: originDate } = timeZone();

  // states
  const [endAt, setEndAt] = React.useState<string>(date);
  const [startAt, setStartAt] = React.useState<string>(date);
  const [noLimits, setNoLimits] = React.useState(false);
  const [noEndDate, setNoEndDate] = React.useState(false);
  const [isPublic, setPublic] = React.useState<boolean>(true);
  const [isLoading, startLoading] = React.useState<boolean>(false);

  // form default input
  const form = useForm<z.infer<typeof couponConsultantSchema>>({
    resolver: zodResolver(couponConsultantSchema),
    defaultValues: {
      code: "",
      discount: 10,
      limits: 1,
      starts_at: originDate,
      expires_at: null,
    },
  });

  const onSubmit = async (data: z.infer<typeof couponConsultantSchema>) => {
    // load state
    startLoading(true);

    // end date
    const FinalEndDate = noEndDate ? null : endAt;

    // create
    try {
      // validate
      if (
        !noEndDate &&
        startAt &&
        FinalEndDate &&
        (isSameDay(parseISO(startAt), parseISO(FinalEndDate)) ||
          isAfter(parseISO(startAt), parseISO(FinalEndDate)))
      ) {
        ZToast({
          state: false,
          message:
            "تاريخ البدء لا يمكن أن يكون بعد تاريخ الانتهاء او نفس التاريخ",
        });
        // load state
        startLoading(false);
        return;
      }

      // create
      const create = await createConsultantsCoupon(
        cid,
        data.code,
        data.discount,
        data.limits,
        startAt,
        FinalEndDate,
        isPublic,
      );

      // validate
      if (create) {
        // success
        ZToast({ state: true, message: "تم إنشاء الكوبون بنجاح" });
        // refresh the page
        window.location.reload();
      } else {
        // load state
        startLoading(false);
        ZToast({
          state: false,
          message: "هذا الكوبون مستخدم بالفعل, برجاء اختيار كوبون اخر",
        });
      }
    } catch {
      // load state
      startLoading(false);
      ZToast({ state: false, message: "حدث خطأ أثناء إنشاء الكوبون" });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-right">إضافة كوبون جديد</h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 text-right"
        >
          {/* Coupon Code */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رمز الكوبون</FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    placeholder="الرمز"
                    {...field}
                    maxLength={6}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase().trim())
                    }
                  />
                </FormControl>
                <FormDescription>
                  رمز الخصم الذي سيُستخدم من قبل العميل{" "}
                  <span className="font-medium">
                    مثال: <span className="text-zblue-200">SH2025</span>
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* separator */}
          <SeparatorA />

          {/* Discount */}
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>نسبة الخصم</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="مثلًا: 10"
                    className="max-w-60"
                    onChange={(e) =>
                      field.onChange(Math.round(parseFloat(e.target.value)))
                    }
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>النسبة المئوية للخصم %</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* separator */}
          <SeparatorA />

          {/* Limits */}
          <FormField
            control={form.control}
            name="limits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>عدد مرات الاستخدام</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    placeholder="مثلاً: 50"
                    className={cn([noLimits && "opacity-75", "max-w-60"])}
                    onChange={(e) =>
                      field.onChange(Math.round(parseFloat(e.target.value)))
                    }
                    disabled={isLoading || noLimits}
                  />
                </FormControl>
                <FormDescription>
                  عدد مرات استخدام الكوبون بواسطة المستخدم
                </FormDescription>
                <FormMessage />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="limit"
                    checked={noLimits}
                    onCheckedChange={(checked) => {
                      form.setValue("limits", 1);
                      setNoLimits(Boolean(checked));
                    }}
                  />
                  <Label htmlFor="limit">استخدام بدون حدود</Label>
                </div>
              </FormItem>
            )}
          />

          {/* separator */}
          <SeparatorA />

          {/* Start Date */}
          <div className="flex flex-col gap-2">
            <Label>تاريخ البدء</Label>
            <DatePicker setDate={setStartAt} lang="ar" date={startAt} />
          </div>

          {/* separator */}
          <SeparatorA />

          {/* Expiry Date */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label>تاريخ الانتهاء</Label>
              <DatePicker
                setDate={setEndAt}
                lang="ar"
                date={endAt}
                disabled={noEndDate}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="end"
                checked={noEndDate}
                onCheckedChange={(checked) => setNoEndDate(Boolean(checked))}
              />
              <Label htmlFor="end">بدون تاريخ انتهاء</Label>
            </div>
          </div>

          {/* separator */}
          <SeparatorA />

          <div className="space-y-2">
            <Label htmlFor="visibility">خصوصية الكوبون</Label>
            <div className="flex items-center gap-2">
              <Checkbox
                id="visibility"
                checked={isPublic}
                onCheckedChange={(checked) => setPublic(Boolean(checked))}
              />
              <Label htmlFor="visibility">عام</Label>
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="bg-zblue-200">
            <LoadingBtn loading={isLoading}>أضف الكوبون</LoadingBtn>
          </Button>
        </form>
      </Form>
    </div>
  );
}
