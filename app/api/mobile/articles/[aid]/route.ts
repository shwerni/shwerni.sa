// React & Next
import { after } from "next/server";

// utils
import { minutesToRead } from "@/utils";
import { HttpError } from "@/lib/api/http-error";
import { parseAid } from "@/utils/mobile/article-aid";
import { extractArticleSideFast } from "@/utils/article";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// prisma data
import { getArticleByAid, getArticleLikes, incrementArticleRead } from "@/data/article";

// prisma types
import type { Categories, Gender } from "@/lib/generated/prisma/enums";

interface ArticleDetails {
  aid: number;
  title: string;
  body: string;
  side: { title: string; text: string }[];
  image: string;
  category: Categories;
  createdAt: string;
  minutes: number;
  reads: number;
  specialties: { id: string; name: string }[];
  faqs: { question: string; answer: string }[];
  consultant: { cid: number; name: string; rate: number | null; gender: Gender } | null;
  likes: { count: number; liked: boolean };
}

// a published article (not a center's), the website's body and side split; one read counted
// after the response (like the website's ArticleReadTracker; a failure never fails the request)
export const GET = createGetRoute<ArticleDetails, { aid: string }>(async (request, { params }) => {
  const user = await requireMobileUser(request);
  const aid = parseAid((await params).aid);

  const article = await getArticleByAid(aid);
  if (!article) throw new HttpError("المقال غير موجود", 404);

  const { body, side } = extractArticleSideFast(article.article);
  const likes = await getArticleLikes(aid, user.id);

  after(() =>
    incrementArticleRead(aid).catch((err) => console.error("[articles] read count", aid, err)),
  );

  return {
    aid: article.aid,
    title: article.title,
    body,
    side: side.map((s) => ({ title: s.h3, text: s.p })),
    image: article.image,
    category: article.category,
    createdAt: article.created_at.toISOString(),
    minutes: minutesToRead(article.article.length),
    reads: article.read,
    specialties: article.specialties.map(({ specialty }) => ({
      id: specialty.id,
      name: specialty.name,
    })),
    faqs: article.faqs,
    consultant:
      article.consultant && article.consultantId
        ? {
            cid: article.consultantId,
            name: article.consultant.name,
            rate: article.consultant.rate,
            gender: article.consultant.gender,
          }
        : null,
    likes,
  };
});
