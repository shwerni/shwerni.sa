"use client";
// React & Next
import Link from "next/link";
import React from "react";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// components
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/app/_components/layout/section";
import LoadingBtn from "@/app/_components/layout/loadingBtn";

// prisma data
import { upsertCollaboration } from "@/data/admin/collaboration";

// prisma types

// icons
import { CircleOff, ExternalLink } from "lucide-react";
import CopyBtn from "@/app/_components/layout/copyBtn";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { UploadButton } from "@/lib/upload";
import { saveUploadedImage } from "@/data/uploads";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Collaboration } from "@/lib/generated/prisma/client";

// props
interface Props {
  iCollaboration: Collaboration | null;
  userId: string;
}

export default function CollaborationProfile({
  userId,
  iCollaboration,
}: Props) {
  // image on load state
  const [uImage, setUImage] = React.useState<boolean>(false);

  // image
  const [image, setImage] = React.useState(iCollaboration?.image || "");

  // schema
  const formSchema = z.object({
    name: z
      .string()
      .min(2, "اسم الشريك يجب أن يحتوي على حرفين على الأقل")
      .max(12, "اسم الشريك يجب ألا يزيد عن 12 حرفًا"),
  });

  // state
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: iCollaboration?.name || "",
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      try {
        if (!image) {
          toast.error("الرجاء رفع صورة الشريك أولاً 📷");
          return;
        }

        // save collaboration
        await upsertCollaboration(userId, values.name, image);

        // toast
        toast.success(
          iCollaboration
            ? "تم تحديث بيانات الشراكة بنجاح ✅"
            : "تم إنشاء الشراكة بنجاح 🎉"
        );

        // refresh
        if (!iCollaboration) window.location.reload();
      } catch {
        toast.error("حدث خطأ أثناء الحفظ ❌");
      }
    });
  };

  return (
    <Section className="space-y-8 w-11/12 max-w-5xl mx-auto">
      <div className="space-y-8">
        <h3 className="text-center text-lg font-bold">الملف الشخصي</h3>

        {iCollaboration && (
          <div className="flex items-center justify-between space-y-3">
            <div className="flex flex-col justify-between gap-8">
              <p>
                <strong>اسم الشريك:</strong> {iCollaboration.name}
              </p>
              <p>
                <strong>نسبة العمولة:</strong> {iCollaboration.commission}%
              </p>
            </div>
            <div className="flex flex-col justify-between items-center gap-3">
              <div className="flex items-center gap-3">
                <Label>الحالة</Label>
                <Badge
                  className={cn([
                    "text-base px-5",
                    iCollaboration?.status
                      ? "bg-green-100 text-green-500"
                      : "bg-red-100 text-red-500",
                  ])}
                >
                  {iCollaboration?.status ? "نشط" : "غير نشط"}
                </Badge>
              </div>
              <Separator className="w-10/12" />
              <CopyBtn
                copy={`?collaboration=${iCollaboration.id}`}
                label="نسخ رابط الشراكة"
              />
            </div>
          </div>
        )}

        <Separator className="w-11/12 max-w-lg mx-auto" />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8"
          >
            <div className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم الشريك</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل اسم الشريك" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>الصورة</Label>
                <div className="flex justify-between items-center">
                  {image !== "" ? (
                    <Image
                      src={image}
                      alt="logo"
                      width={150}
                      height={150}
                      className="rounded"
                    />
                  ) : (
                    <div className="cflex w-24 h-24 bg-slate-200 py-3 px-5 rounded">
                      <CircleOff className="w-6" />
                    </div>
                  )}
                  <UploadButton
                    className="upload-thing my-3"
                    disabled={uImage}
                    endpoint="imageUploader"
                    onUploadBegin={() => setUImage(true)}
                    onClientUploadComplete={async (res) => {
                      // set new iamge preview
                      setImage(res[0].url);
                      // end uploading loading state
                      setUImage(false);
                      // save image to db
                      await saveUploadedImage(res[0].key, userId, res[0].url);
                    }}
                    onUploadError={(error: Error) => {
                      toast.error("upload error");
                      setUImage(false);
                    }}
                  />
                </div>
              </div>
            </div>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-zblue-200 px-7"
            >
              <LoadingBtn loading={isPending}>
                {iCollaboration ? "تحديث" : "إنشاء"}
              </LoadingBtn>
            </Button>
          </form>
        </Form>
      </div>

      <Separator className="w-11/12 max-w-lg mx-auto" />

      <div className="space-y-5">
        <h3 className="text-sm font-semibold mb-2 text-gray-700">
          روابط قد تهمك 🔗
        </h3>
        <div className="space-y-3 text-sm">
          <Link
            href="https://shwerni.sa/available"
            target="_blank"
            className="flex items-center gap-2 text-zblue-200 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            أقرب مستشار متاح
          </Link>
          <Link
            href="https://shwerni.sa/consultant"
            target="_blank"
            className="flex items-center gap-2 text-zblue-200 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            قائمة المستشارين
          </Link>
        </div>
      </div>
    </Section>
  );
}
