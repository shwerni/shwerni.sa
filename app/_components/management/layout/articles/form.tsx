"use client";
// React & Next
import React from "react";
import Image from "next/image";

// package
import { z } from "zod";
import { useForm } from "react-hook-form";

// components
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RichEditorAdmin from "@/app/_components/layout/textEditor/richtexteditor-admin";

// prisma data
import {
  createArticleAdmin,
  updateArticleByAidAdmin,
} from "@/data/admin/article";

// prisma types
import {
  ArticleState,
  Categories,
  UserRole,
} from "@/lib/generated/prisma/enums";

// utils
import { isEnglish, findCategory, findUser } from "@/utils";

// constants
import { categories } from "@/constants/admin";
import { useRouter } from "next/navigation";
import { UploadButton } from "@/lib/upload";
import { saveUploadedImage } from "@/data/uploads";

import { Lang } from "@/types/types";
import { CircleOff } from "lucide-react";
import { Article } from "@/lib/generated/prisma/client";

type Props = {
  article?: Article;
  lang?: Lang;
  variant: "new" | "edit";
  role: UserRole;
  user: string;
};

const articleSchema = z.object({
  title: z.string().min(1, "Title must be at least 1 characters"),
  status: z.nativeEnum(ArticleState),
  category: z.string().min(1, "Category is required"),
});

export function EditArticleForm({ article, user, role, lang, variant }: Props) {
  // lang
  const isEn = isEnglish(lang);

  // router
  const router = useRouter();

  // variant
  const isEdit = variant === "edit" && article !== undefined;

  // state
  const [isSending, setIsSending] = React.useState(false);
  // image on load state
  const [uImage, setUImage] = React.useState<boolean>(false);
  // image
  const [image, setImage] = React.useState(isEdit ? article.image : "");
  const [content, setContent] = React.useState(isEdit ? article.article : "");

  const form = useForm({
    defaultValues: {
      title: isEdit ? article.title : "",
      category: isEdit ? article.category : "",
      status: isEdit ? article.status : ArticleState.HOLD,
    },
  });

  async function onSubmit(data: z.infer<typeof articleSchema>) {
    // loading
    const toastId = toast.loading("updating article...");
    try {
      // loading
      setIsSending(true);

      // supabase
      if (isEdit) {
        const update = await updateArticleByAidAdmin(
          article.aid,
          data.title,
          image,
          content,
          data.category as Categories,
          data.status,
        );
        if (update)
          // success
          toast.success("article updated successfully!", {
            id: toastId,
          });

        if (!update)
          // error
          toast.error("failed to update article.", {
            id: toastId,
          });
      } else {
        // create
        const create = await createArticleAdmin(
          data.title,
          image,
          content,
          data.category as Categories,
          data.status,
        );

        // validate
        if (create)
          // success
          toast.success("article created successfully!", {
            id: toastId,
          });

        // router
        router.push(`${`${findUser(role)?.url}articles`}`);
        if (!create)
          // error
          toast.error("failed to create article.", {
            id: toastId,
          });
      }

      // loading
      setIsSending(false);
    } catch (error) {
      // loading
      setIsSending(false);
      // error
      toast.error("failed to update article. " + error, {
        id: toastId,
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        dir={isEn ? "ltr" : "rtl"}
        lang={lang}
      >
        <div className="space-y-2">
          <Label>{isEn ? "image" : "الصورة"}</Label>
          <div className="flex justify-between items-center">
            {image !== "" ? (
              <Image
                src={image}
                alt="article"
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
                await saveUploadedImage(res[0].key, user, res[0].url);
              }}
              onUploadError={() => {
                toast.error("upload error");
                setUImage(false);
              }}
            />
          </div>
        </div>

        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEn ? "Article Title" : "عنوان المقال"}</FormLabel>
              <FormControl>
                <Input
                  placeholder={isEn ? "Enter title" : "أدخل العنوان"}
                  {...field}
                  disabled={isSending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Content */}
        <RichEditorAdmin
          placeholder={isEn ? "Enter content" : "أدخل المحتوى"}
          content={content}
          onChange={setContent}
          disabled={isSending}
        />

        {/* category - Radio Group */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>{isEn ? "Category" : "الفئة"}</FormLabel>
              <FormControl>
                <RadioGroup
                  disabled={isSending}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 sm:flex flex-row gap-5"
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
                          <FormLabel className="font-normal lowercase">
                            {isEn ? i.id : findCategory(i.id)?.label}
                          </FormLabel>
                        </FormItem>
                      ),
                  )}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Status - Select */}
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem className="max-w-72">
              <FormLabel>{isEn ? "Approval Status" : "حالة القبول"}</FormLabel>
              <Select onValueChange={field.onChange} disabled={isSending}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={field.value} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ArticleState.HOLD}>
                    {isEn ? "Pending" : "قيد المراجعة"}
                  </SelectItem>
                  <SelectItem value={ArticleState.PUBLISHED}>
                    {isEn ? "Approved" : "مقبول"}
                  </SelectItem>
                  <SelectItem value={ArticleState.HIDDEN}>
                    {isEn ? "Rejected" : "مرفوض"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit */}
        <Button type="submit" disabled={isSending}>
          {isEn ? "Save Changes" : "حفظ التعديلات"}
        </Button>
      </form>
    </Form>
  );
}
