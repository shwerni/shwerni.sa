"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ZToast } from "@/components/legacy/layout/toasts";
import LoadingBtn from "@/components/legacy/layout/loadingBtn";

// prisma types
import { BankAccount } from "@/lib/generated/prisma/client";

// schemas
import { BankAccountSchema } from "@/schemas/consultant/iban";

// handlers
import { saveBankAccount } from "@/handlers/conusltant/owner/bank-account";

// utils / constants
import { checkSaudiIban, formatIban, formatIbanInput } from "@/lib/iban";
import { SAUDI_BANKS } from "@/constants/saudi-banks";

// icons
import { Landmark, Save } from "lucide-react";

// props
interface Props {
  bankAccount: BankAccount | null;
}

// consultant bank account form
export function BankAccountForm({ bankAccount }: Props) {
  // loading submit
  const [isSending, startSending] = React.useTransition();

  // form
  const form = useForm<z.infer<typeof BankAccountSchema>>({
    resolver: zodResolver(BankAccountSchema),
    defaultValues: {
      holderName: bankAccount?.holderName ?? "",
      iban: bankAccount ? formatIban(bankAccount.iban) : "SA",
    },
  });

  // detect bank live from the IBAN's embedded SAMA code
  const iban = useWatch({ control: form.control, name: "iban" });
  const ibanCheck = checkSaudiIban(iban ?? "");
  const bank = ibanCheck.ok ? SAUDI_BANKS[ibanCheck.bankCode] : null;

  // on submit
  function onSubmit(data: z.infer<typeof BankAccountSchema>) {
    startSending(() => {
      saveBankAccount(data).then((response) => {
        ZToast(response);
        // mark current values as saved so the button disables until next edit
        if (response.state) form.reset(data);
      });
    });
  }

  return (
    <div className="my-5">
      <h3 className="text-zblue-200 my-3">بيانات الحساب البنكي</h3>
      <Form {...form}>
        <form
          dir="rtl"
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-w-162.5 sm:w-11/12 space-y-8"
        >
          {/* iban */}
          <FormField
            control={form.control}
            name="iban"
            render={({ field }) => (
              <FormItem>
                <FormLabel>رقم الآيبان (IBAN)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    // LTR so the 4-digit groups read in the correct order
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={29}
                    placeholder="SA00 0000 0000 0000 0000 0000"
                    className="font-mono tracking-wider text-left max-w-80"
                    disabled={isSending}
                    onChange={(e) =>
                      field.onChange(formatIbanInput(e.target.value))
                    }
                  />
                </FormControl>
                <FormDescription>
                  24 خانة تبدأ بـ SA، تجده في تطبيق البنك
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* detected bank (read-only, derived from IBAN) */}
          <div className="space-y-2">
            <Label>البنك</Label>
            <div className="flex items-center gap-2 h-10 max-w-80 rounded-md border px-3 bg-zgrey-50 text-sm">
              <Landmark className="w-4 h-4 shrink-0 text-zblue-200" />
              {bank ? (
                <span>{bank.ar}</span>
              ) : (
                <span className="text-muted-foreground">
                  يظهر اسم البنك تلقائياً بعد إدخال الآيبان
                </span>
              )}
            </div>
          </div>

          {/* holder name */}
          <FormField
            control={form.control}
            name="holderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>اسم صاحب الحساب</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="الاسم كما هو مسجل في البنك"
                    className="max-w-80"
                    disabled={isSending}
                  />
                </FormControl>
                <FormDescription>
                  يجب أن يطابق اسم صاحب الحساب في البنك
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* submit */}
          <Button
            type="submit"
            disabled={isSending || !form.formState.isDirty}
            className="w-40 bg-zblue-200 rounded-2xl gap-1"
          >
            <LoadingBtn loading={isSending}>
              حفظ الحساب
              <Save className="w-5" />
            </LoadingBtn>
          </Button>
        </form>
      </Form>
    </div>
  );
}
