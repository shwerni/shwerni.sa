// React & Next
import React from "react";

// components
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ZPhoneInput from "@/app/_components/layout/phoneInput";
import PhonesExample from "@/app/_components/layout/phoneInput/example";

// packages
import { z } from "zod";
import { UseFormReturn } from "react-hook-form";

// schemas
import { Reservation } from "@/schemas";

// icons
import { User as UserIcon } from "lucide-react";

// props
interface Props {
  form: UseFormReturn<z.infer<typeof Reservation>>;
}

const ReservationForm: React.FC<Props> = ({ form }) => {
  // return
  return (
    <Card className="w-11/12 max-w-xl space-y-2 mx-auto">
      <CardContent className="py-5">
        <h3 className="flex flex-row gap-1 text-zblue-200">
          <UserIcon />
          بيانات العميل
        </h3>
        {/* name and phone */}
        <div className="space-y-5">
          {/* user name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex justify-start items-start text-right">
                  الاسم
                </FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="الاسم"
                    {...field}
                    className="bg-zblue-100"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* phone number */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="w-full max-w-80">
                <div className="flex items-center gap-2">
                  {/* label */}
                  <FormLabel>رقم الهاتف</FormLabel>
                  {/* phones example */}
                  <PhonesExample width={21} />
                </div>
                <FormControl>
                  <div dir="ltr">
                    <ZPhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      minWidth="12rem"
                    />
                    <FormDescription className="mt-1 text-right">
                      رقم هاتف مربوط بالواتس اب
                    </FormDescription>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* issues description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اكتب استشارتك</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="استشارتك باختصار ( اختياري )"
                    className="resize-none bg-zblue-100"
                    {...field}
                    dir="rtl"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
export default ReservationForm;
