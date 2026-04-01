"use client";

// React
import React from "react";

// packages
import { z } from "zod";
import "@smastrom/react-rating/style.css";
import { useForm } from "react-hook-form";
import { Rating } from "@smastrom/react-rating";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { Textarea } from "@/components/ui/textarea";

// prsiam data
import { addArticleComment } from "@/data/article";

// icons
import { CheckCircle2, MessageSquarePlus } from "lucide-react";

// schema
const ArticleCommentSchema = z.object({
  name: z.string().min(3, "الاسم مطلوب").max(15, "الاسم طويل جداً"),
  comment: z.string().min(5, "التعليق مطلوب").max(150, "التعليق طويل جداً"),
});

// props
interface Props {
  aid: number;
  name?: string | null;
  author?: string | null;
}

export default function AddArticleComment({ aid, name, author }: Props) {
  const [rating, setRating] = React.useState<number>(0);
  const [done, setDone] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof ArticleCommentSchema>>({
    resolver: zodResolver(ArticleCommentSchema),
    defaultValues: {
      name: name ?? "",
      comment: "",
    },
  });

  async function onSubmit(data: z.infer<typeof ArticleCommentSchema>) {
    if (!rating || rating === 0) {
      toast.warning({
        title: "التقييم مطلوب",
        message: "يرجى اختيار عدد النجوم للمتابعة",
      });
      return;
    }

    const response = await addArticleComment({
      aid,
      name: name ?? data.name,
      author: author ?? undefined,
      comment: data.comment,
      rate: rating,
    });

    if (response?.success) {
      setDone(true);
      toast.success({ message: "تم إرسال تعليقك، سيتم مراجعته قريباً" });
    } else {
      toast.error({ message: "حدث خطأ ما، حاول مرة أخرى" });
    }
  }

  // success state
  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          تم إرسال تعليقك بنجاح
        </p>
        <p className="text-xs text-slate-400">سيتم مراجعة تعليقك قريباً</p>
      </div>
    );
  }

  return (
    <div className="w-10/12 mx-auto">
      {/* header */}
      <div className="inline-flex items-center gap-2 mb-3">
        <MessageSquarePlus className="w-4 h-4 text-theme" />
        <h4 className="text-[#094577] text-base font-semibold">أضف تعليقك</h4>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* name — only when not logged in */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="اسمك"
                    {...field}
                    className="h-8 text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* comment */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="شاركنا رأيك في هذا المقال..."
                    {...field}
                    disabled={
                      form.formState.isLoading || form.formState.isSubmitting
                    }
                    rows={3}
                    className="resize-none text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* rating + submit */}
          <div className="flex items-center justify-between gap-3">
            <Rating
              style={{ maxWidth: 110 }}
              value={rating}
              onChange={setRating}
              transition="zoom"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={form.formState.isLoading || form.formState.isSubmitting}
              className="gap-1.5 text-xs h-8 px-4"
            >
              <MessageSquarePlus className="w-3 h-3" />
              إرسال
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
