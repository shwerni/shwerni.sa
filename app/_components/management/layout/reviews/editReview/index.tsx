"use client";
// React & Next
import React from "react";
import Link from "next/link";

// components
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ZSection } from "@/app/_components/layout/section";
import EditReviewForm from "@/app/_components/management/layout/reviews/editReview/form";

// utils
import { isEnglish, findUser } from "@/utils";

// prisma types
import { Review } from "@/lib/generated/prisma/client";

// prisma data
import { acceptNewreviewAdmin } from "@/data/admin/review";

// types
import { Lang } from "@/types/types";

// auth type
import { User } from "next-auth";

// icons
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// props
interface Props {
  lang?: Lang;
  user: User;
  review: Review;
}

export default function EditReview({ user, lang, review }: Props) {
  // check langauge
  const isEn = isEnglish(lang);

  // transistion
  const [onSend, startSending] = React.useTransition();

  // recheck this review
  const reCheckReview = () => {
    startSending(() => {
      acceptNewreviewAdmin(
        review.created_at,
        review.id,
        review.name,
        review.consultantId,
        review.rate,
        review.comment,
      ).then((response) => {
        if (response) {
          // toast
          toast.success("rechecked successfully");
          // return
          return true;
        }
        // toast
        toast.success("error has occurred");
        // return
        return null;
      });
    });
  };

  // return
  return (
    <ZSection>
      <div
        className="max-w-4xl sm:w-10/12 mx-auto space-y-10"
        dir={isEn ? "ltr" : "rtl"}
      >
        <Link
          href={`${findUser(user.role)?.url}reviews`}
          className="flex flex-row gap-1 items-center w-fit"
        >
          {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          <h5 className="pt-1">{isEn ? "reviews" : "التقييمات"}</h5>
        </Link>
        <div className="w-10/12 mx-auto space-y-10">
          {/* title */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg capitalize">
              {isEn ? "edit review" : "تعديل التقييم"} #{review?.name}
            </h3>
            {/* recheck with ai button */}
            <Button
              type="button"
              onClick={reCheckReview}
              disabled={onSend}
              className="zgreyBtn"
            >
              recheck with ai
            </Button>
          </div>
          <EditReviewForm review={review} lang={lang} user={user} />
          <div>
            <ul className="flex flex-col gap-2 list-disc mx-5">
              {review.info.map((i, index) => (
                <li key={index} className="text-sm">
                  {i}
                </li>
              ))}
              <li>{review.verified ? "verified" : "not verified"}</li>
            </ul>
          </div>
        </div>
      </div>
    </ZSection>
  );
}
