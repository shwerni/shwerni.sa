// React & Next
import { after, connection } from "next/server";

// components
import { ArticleLikeButton } from "./like";
import AddArticleComment from "../add-comments";

// prisma data
import { getArticleLikes, incrementArticleRead } from "@/data/article";

// lib
import { userServer } from "@/lib/auth/server";

// the per-user and per-view parts of an article page. each one is rendered inside its own
// <Suspense>, so the cached article (title, cover, body) never waits for them and can be
// part of the prerendered page

// the like button with the visitor's own state
export async function ArticleLike({ aid }: { aid: number }) {
  const userId = (await userServer())?.id || null;
  const like = await getArticleLikes(aid, userId);

  return (
    <ArticleLikeButton
      aid={aid}
      userId={userId}
      liked={like?.liked ?? false}
      iLikes={like?.count}
    />
  );
}

// same size as the like button (the 24px icon), shown while it loads; not clickable
export function ArticleLikeFallback({ aid }: { aid: number }) {
  return (
    <div className="pointer-events-none opacity-70" aria-hidden>
      <ArticleLikeButton aid={aid} userId={null} liked={false} iLikes={0} />
    </div>
  );
}

// the comment form, knowing whether the visitor is signed in
export async function ArticleCommentForm({ aid }: { aid: number }) {
  const userId = (await userServer())?.id || null;
  return <AddArticleComment aid={aid} author={userId} />;
}

// counts the view after the response is sent. connection() keeps it at request time only
// (never during the build prerender); a failed write is logged and never breaks the page
export async function ArticleReadTracker({ aid }: { aid: number }) {
  await connection();

  after(async () => {
    try {
      await incrementArticleRead(aid);
    } catch (error) {
      console.error(`article read counter failed (aid ${aid})`, error);
    }
  });

  return null;
}
