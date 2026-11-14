// packages
import { z } from "zod";

// utils
import { rateLimit } from "@/lib/rate-limit";
import { HttpError } from "@/lib/api/http-error";
import { parseAid } from "@/utils/mobile/article-aid";
import { createGetRoute, createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// prisma data
import { addArticleComment, getArticleByAid, getArticleComments } from "@/data/article";

interface PublicArticleComment {
  id: string;
  name: string;
  comment: string;
  rate: number;
  createdAt: string;
  consultant: { name: string; image: string | null } | null;
}

const CommentSchema = z.object({
  comment: z.string().trim().min(5).max(150),
  rate: z.number().int().min(1).max(5),
});

// the website's comment form takes a name up to 15 characters
const NAME_MAX = 15;

// a published article's published comments: public fields only (never author / user / consultant ids)
export const GET = createGetRoute<PublicArticleComment[], { aid: string }>(
  async (request, { params }) => {
    await requireMobileUser(request);
    const aid = parseAid((await params).aid);
    if (!(await getArticleByAid(aid))) throw new HttpError("المقال غير موجود", 404);

    const comments = await getArticleComments(aid);
    return comments.map((c) => ({
      id: c.id,
      name: c.name,
      comment: c.comment,
      rate: c.rate,
      createdAt: c.created_at.toISOString(),
      consultant: c.consultant ? { name: c.consultant.name, image: c.consultant.image } : null,
    }));
  },
);

// a comment as the session's user (the name and the author from the session), HOLD until the
// admin publishes it (the website's flow); 5 per 10 minutes per user
export const POST = createPostRoute<{ submitted: true }, { aid: string }>(
  async (request, { params }) => {
    const user = await requireMobileUser(request);
    const aid = parseAid((await params).aid);

    const parsed = CommentSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    if (!(await getArticleByAid(aid))) throw new HttpError("المقال غير موجود", 404);

    if (!(await rateLimit(`article-comment:${user.id}`, { limit: 5, window: "10 m" }))) {
      throw new HttpError("عدد كبير من المحاولات، حاول لاحقاً", 429);
    }

    const name = (user.name ?? "").trim().slice(0, NAME_MAX) || "مستخدم";
    const saved = await addArticleComment({
      aid,
      name,
      comment: parsed.data.comment,
      rate: parsed.data.rate,
      author: user.id,
    });
    if (!saved.success) throw new Error("article comment not saved");
    return { submitted: true };
  },
);
