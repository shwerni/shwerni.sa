"use client";
import React from "react";
import { toast } from "@/components/shared/toast";
import { toggleArticleLike } from "@/data/article";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";

interface Props {
  aid: number;
  liked: boolean;
  userId: string | null;
  iLikes?: number;
}

export function ArticleLikeButton({ aid, liked, iLikes = 0, userId }: Props) {
  const [isLiked, setIsLiked] = React.useState<boolean>(liked);
  const [likes, setLikes] = React.useState<number>(iLikes);
  const [pending, setPending] = React.useState<boolean>(false);

  const handleLike = async () => {
    if (!userId) {
      toast.info({
        message: "يرجى تسجيل الدخول لتتمكن من الإعجاب بهذا المقال",
      });
      return;
    }

    if (pending) return; // prevent double clicks

    // snapshot before mutation
    const prevLiked = isLiked;
    const prevCount = likes;

    // optimistic update
    setPending(true);
    setIsLiked(!prevLiked);
    setLikes((c) => (!prevLiked ? c + 1 : Math.max(0, c - 1)));

    try {
      const result = await toggleArticleLike(aid, userId);
      // sync with server truth
      setIsLiked(result.liked);
      setLikes(result.count);
    } catch {
      // rollback to snapshot
      setIsLiked(prevLiked);
      setLikes(prevCount);
      toast.error({ message: "حدث خطأ، حاول مجدداً" });
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={pending}
      className="flex items-end gap-2 group disabled:opacity-70"
    >
      {isLiked ? (
        <AiFillLike className="w-6 h-6 text-theme transition-colors duration-200" />
      ) : (
        <AiOutlineLike className="w-6 h-6 text-gray-400 group-hover:text-theme transition-colors duration-200" />
      )}
      {likes > 0 && (
        <span
          className={`font-semibold text-sm ${isLiked ? "text-theme" : "text-gray-600"}`}
        >
          {likes}
        </span>
      )}
    </button>
  );
}
