import React from "react";
import { toast } from "@/components/shared/toast";
import { PiHandsClappingLight } from "react-icons/pi";
import { toggleArticleLike } from "@/data/article";

interface Props {
  aid: number;
  liked: boolean;
  userId: string | null;
  iLikes?: number;
}

export function ArticleLikeButton({ aid, liked, iLikes = 0, userId }: Props) {
  const [isLiked, setIsLiked] = React.useState<boolean>(liked);
  const [likes, setLikes] = React.useState<number>(iLikes);

  const handleLike = async () => {
    if (!userId) {
      toast.info({
        message: "يرجى تسجيل الدخول لتتمكن من الإعجاب بهذا المقال",
      });
      return;
    }

    setIsLiked((prev) => !prev);

    try {
      const result = await toggleArticleLike(aid, userId);
      setIsLiked(result.liked);
      setLikes(result.count);
    } catch {
      setIsLiked(isLiked);
      toast.error({ message: "حدث خطأ، حاول مجدداً" });
    }
  };

  return (
    <button onClick={handleLike} className="flex items-end gap-2 group">
      <PiHandsClappingLight
        className={`w-6 h-6 transition-colors duration-200 ${
          isLiked
            ? "text-yellow-500 fill-yellow-400" // liked  → colored
            : "text-gray-400 group-hover:text-yellow-400" // hover preview
        }`}
      />
      {likes > 0 && (
        <span
          className={`text-sm ${isLiked ? "text-yellow-500" : "text-gray-600"}`}
        >
          {likes}
        </span>
      )}
    </button>
  );
}
