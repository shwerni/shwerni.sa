// React & Next
import React from "react";

// components
import Stars from "@/components/clients/shared/stars";

// prisma types
import { Review } from "@/lib/generated/prisma/client";

// utils
import { cn } from "@/lib/utils";
import { dateToString } from "@/utils/moment";

// shadcn ui
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// props
interface Props {
  review: Review;
  className?: string;
}

const ReviewCard: React.FC<Props> = ({ review, className }: Props) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className={cn(
            className,
            "flex flex-col justify-between gap-3 h-60 bg-white py-6 px-4 sm:px-6 rounded-lg cursor-pointer",
          )}
        >
          <div className="inline-flex items-center gap-2">
            <Stars rate={review.rate} />
            <span>{review.rate.toFixed(1)}</span>
          </div>
          <div className="space-y-2">
            <h4 className="text-[#094577] text-lg font-medium">
              {review.comment.split(" ").slice(0, 3).join(" ")}...
            </h4>
            <p className="text-sm font-medium text-gray-500 line-clamp-4">{`"${review.comment}"`}</p>
          </div>
          <div className="inline-flex items-center gap-2">
            <div className="flex items-center justify-center bg-gray-300 text-gray-700 w-10 h-10 uppercase font-bold text-xs rounded-full">
              {review.name[0]}
              {review.name[1]}
            </div>
            <div className="flex flex-col gap-1">
              <h5 className="text-theme font-medium text-base">
                {review.name}
              </h5>
              <h6 className="text-gray-400 text-xs">
                {dateToString(review.created_at)}
              </h6>
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#094577]">{review.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 leading-relaxed">{`"${review.comment}"`}</p>
        <DialogFooter>
          <div className="inline-flex items-center gap-2">
            <Stars rate={review.rate} />
            <span>{review.rate.toFixed(1)}</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewCard;
