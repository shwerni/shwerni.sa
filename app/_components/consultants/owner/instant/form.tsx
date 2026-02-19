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

// schema
import { InstantSchema } from "@/schemas";

// prisma data
import {
  UpdateInstantOwnerState,
  updateOfficialInstantState,
} from "@/data/instant";

// prisma types
import { Instant } from "@/lib/generated/prisma/client";

// props
interface Props {
  cid: number;
  available: boolean;
  author: string;
  instant: Instant | null;
}

const InstantForm: React.FC<Props> = ({ author, cid, instant, available }) => {
  // loading submit
  const [isSending, startSending] = React.useTransition();
  const [isOfficial, setIsOfficial] = React.useState<boolean>(
    instant?.statusA ?? false
  );
  const [isOfficialSending, setIsOfficialSending] = React.useState(false);

  // form
  const form = useForm<z.infer<typeof InstantSchema>>({
    resolver: zodResolver(InstantSchema),
    defaultValues: {
      // state
      status: instant && available ? instant.status : false,
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
        UpdateInstantOwnerState(author, cid, data.status, data.cost).then(
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
          }
        );
      }
    });
  };

  // switch change handler
  const handleOfficialStatusChange = async (checked: boolean) => {
    setIsOfficialSending(true);
    const success = await updateOfficialInstantState(cid, checked);
    setIsOfficialSending(false);

    if (success) {
      setIsOfficial(checked);
      ZToast({
        state: true,
        message: `تم تغيير حالة المستشار الرسمي إلى ${
          checked ? "مفعل" : "غير مفعل"
        }`,
      });
    } else {
      ZToast({
        state: false,
        message: "فشل تحديث حالة المستشار الرسمي",
      });
    }
  };

  // return
  return (
    <Form {...form}>
      <form className="gap-5 max-w-[650px] sm:w-11/12 space-y-10">
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
            <FormItem className="flex justify-between items-center w-full">
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
                  disabled={isSending || !available}
                />
              </FormControl>
              <div className="cflex">
                <FormLabel>حالة الاتصال</FormLabel>
                <Badge
                  className={`${
                    field.value ? "bg-green-500" : "bg-red-500"
                  } pt-1.5 pb-1`}
                >
                  {field.value ? "نشط" : "معطل"}
                </Badge>
              </div>
            </FormItem>
          )}
        />
        {/*  official switch */}
        {cid === 5 || cid === 36 || cid === 193 ? (
          <div className="flex justify-between items-center w-full">
            <Switch
              dir="ltr"
              checked={isOfficial}
              onCheckedChange={handleOfficialStatusChange}
              disabled={isOfficialSending}
            />
            <div className="cflex gap-2">
              <FormLabel>حالة الخط الساخن</FormLabel>
              <Badge
                className={`${
                  isOfficial ? "bg-green-500" : "bg-gray-400"
                } pt-1.5 pb-1`}
              >
                {isOfficial ? "مفعل" : "غير مفعل"}
              </Badge>
            </div>
          </div>
        ) : (
          ""
        )}
      </form>
    </Form>
  );
};

export default InstantForm;
