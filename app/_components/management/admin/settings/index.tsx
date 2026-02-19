"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import ExternalLink from "@/app/_components/layout/links";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";

// lib
import { extractSettings } from "@/lib/site/settings";

// prisma types
import { Setting } from "@/lib/generated/prisma/client";
import { PaymentMethod } from "@/lib/generated/prisma/enums";

// prisma data
import { setSettings } from "@/data/admin/settings/settings";

// schema
import { settingsSchema } from "@/schemas/admin";

// constants
import { paymentMethods } from "@/constants/admin";
import { toast } from "sonner";

// props
interface Props {
  iSettings: Setting[];
}

// types
type SettingsTypes = {
  commission: number | null;
  tax: number | null;
  payments: PaymentMethod[];
  coupon: boolean;
};

const SettingsAdmin = ({ iSettings }: Props) => {
  // on sending
  const [onSending, startSending] = React.useTransition();

  // settings
  const { commission, tax, payments, coupon } = extractSettings<SettingsTypes>(
    iSettings,
    ["commission", "tax", "payments", "coupon"],
  );

  // form  default input
  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      commission: commission ?? undefined,
      tax: tax ?? undefined,
      payments: payments ?? [PaymentMethod.visaMoyasar],
      coupon: coupon ?? false,
    },
  });

  // onSubmit
  function onSubmit(data: z.infer<typeof settingsSchema>) {
    startSending(() => {
      Promise.all([
        setSettings("finance", {
          tax: data.tax,
          commission: data.commission,
          payments: data.payments,
        }),
        setSettings("features", {
          coupon: data.coupon,
        }),
      ]).then((response) => {
        if (response) {
          toast.success("settings has been successfully updated");
        } else {
          toast.error("error has occurred");
        }
      });
    });
  }

  // return
  return (
    <>
      {/* settings form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* tax & commission*/}
          <div className="grid grid-cols-2 gap-5 justify-between">
            {/* commission */}
            <FormField
              control={form.control}
              name="commission"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>default commission</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="default commission"
                      {...field}
                      type="number"
                      disabled={onSending}
                    />
                  </FormControl>
                  <FormDescription>
                    platform {100 - form.getValues("commission")}% | owners{" "}
                    {form.getValues("commission")}%
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* tax */}
            <FormField
              control={form.control}
              name="tax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{"tax"}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="tax"
                      {...field}
                      type="number"
                      disabled={onSending}
                    />
                  </FormControl>
                  <FormDescription>
                    tax will be {form.getValues("tax")}%
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* payment method */}
          <FormField
            control={form.control}
            name="payments"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">payment method</FormLabel>
                  <FormDescription>
                    payment methods displayed to clients
                  </FormDescription>
                </div>
                {paymentMethods.map((i, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name="payments"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={index}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(i.mehtod)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, i.mehtod])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== i.mehtod,
                                      ),
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {i.mehtod}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                ))}
                <FormMessage />
              </FormItem>
            )}
          />
          {/* separator */}
          <Separator className="w-3/4 mx-auto max-w-60" />
          {/* coupon method */}
          <FormField
            control={form.control}
            disabled={onSending}
            name="coupon"
            render={({ field }) => (
              <div className="flex flex-row items-start gap-2 space-y-0">
                {/* terms and conditions */}
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">coupon</FormLabel>
                    <FormDescription>
                      display coupons to clients
                    </FormDescription>
                    <ExternalLink label="coupons page" link="/zadmin/coupons" />
                  </div>
                  <div className="flex flex-row items-start gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>coupons</FormLabel>
                    </div>
                  </div>
                </FormItem>
              </div>
            )}
          />
          {/* submit button */}
          <div className="w-fit mx-auto">
            <Button disabled={onSending} type="submit">
              <LoadingBtnEn loading={onSending}>send message</LoadingBtnEn>
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
export default SettingsAdmin;
