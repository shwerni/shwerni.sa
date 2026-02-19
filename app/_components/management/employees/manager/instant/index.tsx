/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// React  & Next
import React from "react";

// package
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// components
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { ZToast } from "@/app/_components/layout/toasts";
import { Separator } from "@/components/ui/separator";

// schema
import { InstantSchema } from "@/schemas";

// prisma data
import { UpdateInstantOwnerState } from "@/data/instant";

// lib
import { newOnlineUser } from "@/lib/database/supabase";
import { Instant } from "@/lib/generated/prisma/client";

// prisma types

// props
interface Props {
  author: string;
  supabaseConfig: any;
  instant: Instant | null;
}

const ManagerInstantForm: React.FC<Props> = ({
  author,
  supabaseConfig,
  instant,
}) => {
  React.useEffect(() => {
    newOnlineUser(supabaseConfig, author);
  }, [author, supabaseConfig]);

  // loading submit
  const [isSending, startSending] = React.useTransition();

  // form
  const form = useForm<z.infer<typeof InstantSchema>>({
    resolver: zodResolver(InstantSchema),
    defaultValues: {
      // state
      status: instant ? instant.status : false,
      // cost
      cost: instant && instant.cost ? instant.cost : 0,
    },
  });

  // on submit
  const onSubmit = async (data: z.infer<typeof InstantSchema>) => {
    if (!data.cost) {
      // error toast
      ZToast({ state: false, message: "السيرة الذاتية اجباري" });
      // return
      return;
    }
    // turn on consultant
    startSending(() => {
      // start sending
      if (data.cost) {
        // handle consultant fields submited data
        UpdateInstantOwnerState(author, 1, data.status, data.cost).then(
          (response) => {
            // toast result
            if (response) {
              ZToast({
                state: true,
                message: `تم تغيير حاله النشاط الي ${
                  data.status ? "نشط" : "معطل"
                }`,
              });
            } else {
              // error occurred
              ZToast({
                state: false,
                message: "حدث خطأ ما",
              });
              // reset switcher
              form.setValue("status", false);
              // return
              return;
            }
          },
        );
      }
    });
  };

  // return
  return (
    <div className="max-w-[650px] sm:w-11/12 mx-auto my-5 space-y-5" dir="rtl">
      <h6>تفعيل مستشارين شاورني للحجز الفوري</h6>
      <Form {...form}>
        <form className="flex items-center justify-between gap-5">
          <FormField
            control={form.control}
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>تكلفة الحجز الفوري (30 دقيقة)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="سعر استشارة 30 دقيقة"
                    className="max-w-32"
                    {...field}
                    type="number"
                    disabled={isSending}
                  />
                </FormControl>
                <FormDescription className="text-xs w-10/12">
                  {form.getValues("cost") ? (
                    <>
                      السعر النهائي {(form.getValues("cost") * 1.15).toFixed(2)}{" "}
                      ر.س
                    </>
                  ) : (
                    ""
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* switcher */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="flex flex-col items-center w-fit space-y-3">
                <FormControl>
                  <Switch
                    dir="ltr"
                    checked={field.value}
                    onCheckedChange={async (checked) => {
                      const isValid = await form.trigger("cost");
                      if (isValid) {
                        field.onChange(checked);
                      }
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={isSending}
                  />
                </FormControl>
                <div className="cflex">
                  <FormLabel>حالة الاتصال</FormLabel>
                  <Badge
                    className={`${field.value ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {field.value ? "نشط" : "معطل"}
                  </Badge>
                </div>
              </FormItem>
            )}
          />
        </form>
      </Form>
      <Separator className="w-11/12 max-w-96 mx-auto" />
    </div>
  );
};

export default ManagerInstantForm;
