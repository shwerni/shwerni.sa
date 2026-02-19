"use client";
import React from "react";
import { useRouter } from "next/navigation";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { ProgramSchema } from "@/schemas";

// UI Components
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { categories } from "@/constants/admin";
import { createNewProgram } from "@/data/program";
import { ZToast } from "@/app/_components/layout/toasts";
import LoadingBtn from "@/app/_components/layout/loadingBtn";
import { Save } from "lucide-react";

export default function CreateProgramForm() {
  // router
  const router = useRouter();

  // loading submit
  const [isSending, startSending] = React.useTransition();

  const form = useForm<z.infer<typeof ProgramSchema>>({
    resolver: zodResolver(ProgramSchema),
    defaultValues: {
      title: "",
      summary: "",
      duration: 60,
      description: "",
      price: 500,
      sessions: 1,
      features: [""],
      category: undefined,
    },
  });

  const features = form.watch("features");

  const onSubmit = (data: z.infer<typeof ProgramSchema>) => {
    startSending(async () => {
      try {
        const response = await createNewProgram(data);
        if (response?.prid) {
          ZToast({ state: true, message: "تم الإنشاء بنجاح" });
          router.push(`/dashboard/programs/${response.prid}`);
        } else {
          ZToast({ state: false, message: "فشل في إنشاء البرنامج" });
        }
      } catch {
        ZToast({ state: false, message: "حدث خطأ غير متوقع" });
      }
    });
  };

  return (
    <div className="px-3 sm:px-5 py-5 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-center">إنشاء برنامج جديد</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <fieldset disabled={isSending} className="space-y-8">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>العنوان</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="عنوان البرنامج" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الملخص</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="ملخص مختصر" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="وصف البرنامج"
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>الفئة</FormLabel>
                  <FormControl>
                    <RadioGroup
                      disabled={isSending}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 sm:flex flex-row space-y-1"
                      dir="rtl"
                    >
                      {categories.map(
                        (i, index) =>
                          i.status && (
                            <FormItem
                              key={index}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormControl>
                                <RadioGroupItem value={i.id} />
                              </FormControl>
                              <FormLabel className="font-normal px-2">
                                {i.category}
                              </FormLabel>
                            </FormItem>
                          ),
                      )}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>السعر</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد الجلسات</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مدة البرنامج</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={String(field.value)}
                    >
                      <SelectTrigger className="max-w-[200px]" dir="rtl">
                        <SelectValue placeholder="مدة البرنامج" />
                      </SelectTrigger>
                      <SelectContent
                        dir="rtl"
                        className="bg-zblue-100 text-zblack-100"
                      >
                        <SelectItem value="60">60 دقيقة</SelectItem>
                        {/* <SelectItem value="45">45 دقيقة</SelectItem> */}
                        <SelectItem value="30">30 دقيقة</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>المميزات</FormLabel>
              <div className="space-y-2">
                {features.map((feature, index) => (
                  <Input
                    key={index}
                    value={feature}
                    onChange={(e) => {
                      const updated = [...features];
                      updated[index] = e.target.value;
                      form.setValue("features", updated);
                    }}
                  />
                ))}
                <div className="flex items-center justify-between max-w-80">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.setValue("features", [...features, ""])}
                  >
                    + إضافة ميزة
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (features.length > 1) {
                        const updated = features.slice(0, -1);
                        form.setValue("features", updated);
                      }
                    }}
                  >
                    - حذف ميزة
                  </Button>
                </div>
              </div>
              {form.formState.errors.features && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.features.message as string}
                </p>
              )}
            </FormItem>

            <Button type="submit" className="w-40 bg-zblue-200 gap-2">
              <LoadingBtn loading={isSending}>
                <Save className="w-5" />
                حفظ البرنامج
              </LoadingBtn>
            </Button>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}
