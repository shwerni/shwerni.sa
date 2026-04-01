// React & Next
import Link from "next/link";

// components
import Stars from "../shared/stars";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LinkButton } from "@/components/shared/link-button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// utils
import { consultantGenderLabel } from "@/utils";

// get article comments
import { getArticleComments } from "@/data/article";

// icons
import {
  MessageSquare,
  BadgeCheck,
  CalendarCheckIcon,
  CheckCircle2,
} from "lucide-react";
import ConsultantImage from "../shared/consultant-image";

type ArticleCommentRow = Awaited<ReturnType<typeof getArticleComments>>[number];

type ConsultantComment = ArticleCommentRow & {
  consultantId: number;
  consultant: NonNullable<ArticleCommentRow["consultant"]>;
};

function isConsultantComment(c: ArticleCommentRow): c is ConsultantComment {
  return c.consultantId !== null && c.consultant !== null;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function ConsultantCommentCard({ comment }: { comment: ConsultantComment }) {
  return (
    <div className="relative rounded-xl border border-[#094577]/20 bg-linear-to-br from-[#f0f6ff] to-[#e8f1fb] dark:from-[#0d1f38] dark:to-[#0a1a30] p-4 space-y-4 shadow-sm border-r-4 border-r-[#34BE8F] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-0.5 sm:gap-3">
        <div className="flex items-center gap-3">
          <ConsultantImage
            gender={comment.consultant.gender}
            image={comment.consultant.image}
            size="base"
          />
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/consultants/${comment.consultant.cid}`}
              className="inline-flex items-center gap-1 text-sm font-bold text-[#094577] hover:underline underline-offset-2"
            >
              {comment.consultant.name}
              <BadgeCheck className="w-4 h-4 text-[#094577]" />
            </Link>
            {/* Green visual indicator for Answer */}
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-500" />
              <span className="text-[11px] text-[#34BE8F] dark:text-green-500 font-bold tracking-wide">
                إجابة مستشار معتمدة
              </span>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Stars rate={comment.rate} />
          <span className="text-xs text-[#094577] font-bold">
            {comment.rate.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Comment Body */}
      <div className="bg-white dark:bg-slate-900/50 rounded-lg p-3.5 border border-[#094577]/5">
        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
          {comment.comment}
        </p>
      </div>

      {/* Enhanced CTA Section */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            هل تحتاج إلى استشارة مخصصة لحالتك؟
          </span>
          <LinkButton
            href={`/consultants/${comment.consultant.cid}`}
            variant="default"
            className="w-full sm:w-auto bg-[#094577] hover:bg-[#07355c] text-white shadow-md shadow-[#094577]/20 transition-all gap-2 py-2"
          >
            <CalendarCheckIcon className="w-4 h-4" />
            ناقش حالتك مع ال{consultantGenderLabel(
              comment.consultant.gender,
            )}{" "}
            {comment.consultant.name}
          </LinkButton>
        </div>

        <p
          className="text-[11px] text-slate-400 text-left shrink-0 pb-1"
          dir="ltr"
        >
          {formatDate(comment.created_at)}
        </p>
      </div>
    </div>
  );
}

function UserCommentCard({ comment }: { comment: ArticleCommentRow }) {
  return (
    <div className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2.5">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs">
              {initials(comment.name)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {comment.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Stars rate={comment.rate} />
          <span className="text-xs text-slate-500">
            {comment.rate.toFixed(1)}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pr-1">
        {comment.comment}
      </p>

      <p className="text-[11px] text-slate-400 text-left" dir="ltr">
        {formatDate(comment.created_at)}
      </p>
    </div>
  );
}

export default async function ArticleComments({ aid }: { aid: number }) {
  const comments = await getArticleComments(aid);

  const consultantComments = comments.filter(isConsultantComment);
  const userComments = comments.filter((c) => !isConsultantComment(c));

  const total = comments.length;

  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-theme" />
        <h4 className="text-[#094577] text-base font-semibold">
          التعليقات
          {total > 0 && (
            <span className="mr-1.5 text-sm font-normal text-slate-400">
              ({total})
            </span>
          )}
        </h4>
      </div>

      {total === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">
          لا توجد تعليقات بعد، كن أول من يعلّق!
        </p>
      ) : (
        <ScrollArea className="h-125" dir="rtl">
          <div className="space-y-3 pb-2">
            {consultantComments.map((c) => (
              <ConsultantCommentCard key={c.id} comment={c} />
            ))}

            {consultantComments.length > 0 && userComments.length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
                <span className="text-[11px] text-slate-400">
                  تعليقات الزوار
                </span>
                <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
              </div>
            )}

            {userComments.map((c) => (
              <UserCommentCard key={c.id} comment={c} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
