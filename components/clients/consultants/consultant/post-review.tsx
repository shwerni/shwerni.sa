"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Rating } from "@smastrom/react-rating";
import "@smastrom/react-rating/style.css";

// components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

// prisma data

// schemas

// icons
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "@/components/shared/toast";
import { CommentSchema } from "@/schemas";
import { acceptNewreview } from "@/data/review";

// props
interface Props {
  name: string | null;
  author: string | null;
  cid: number;
  consultant: string;
}

// return default
export default function AddYourReview({
  cid,
  author,
  consultant,
  name,
}: Props) {
  // rate value
  const [rating, setRating] = React.useState<number>(0);

  // is rated or not ( after rated )
  const [rated, setRated] = React.useState<boolean>(false);

  // default input
  const form = useForm<z.infer<typeof CommentSchema>>({
    resolver: zodResolver(CommentSchema),
    defaultValues: {
      name: name || "",
      comment: "",
    },
  });

  // on submit
  async function onSubmit(data: z.infer<typeof CommentSchema>) {
    // post
    const response = await acceptNewreview(
      cid,
      consultant ?? "",
      author ?? "guest",
      name ?? data.name,
      data.comment,
      rating,
    );

    if (response) {
      setRated(true);
      toast.success({ message: "تم ارسال تقييمك, سيتم مراجعة التعليق" });
    } else {
      toast.error({ message: "حدث خطأ ما" });
    }
  }

  // success state
  if (rated)
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500" />
        <p className="text-sm font-medium text-gray-700">
          تم إرسال تقييمك بنجاح
        </p>
        <p className="text-xs text-gray-400">سيتم مراجعة تعليقك قريباً</p>
      </div>
    );

  return (
    <div className="w-10/12 mx-auto">
      {/* header — matches ConsultantReviews title style */}
      <div className="inline-flex items-center gap-2 mb-3">
        <Send className="w-4 h-4 text-theme" />
        <h4 className="text-[#094577] text-base font-semibold">أضف تقييمك</h4>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          {/* name — only if guest */}
          {!name && !author && (
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
          )}

          {/* comment */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder={`تجربتك مع ${consultant}...`}
                    {...field}
                    disabled={
                      form.formState.isLoading || form.formState.isSubmitting
                    }
                    rows={2}
                    className="resize-none text-sm"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* rating + submit — same row to save height */}
          <div className="flex items-center justify-between gap-3">
            <Rating
              style={{ maxWidth: 100 }}
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
              <Send className="w-3 h-3" />
              إرسال
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
