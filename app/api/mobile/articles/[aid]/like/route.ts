// utils
import { HttpError } from "@/lib/api/http-error";
import { parseAid } from "@/utils/mobile/article-aid";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// prisma data
import { getArticleByAid, toggleArticleLike } from "@/data/article";

// like / unlike a published article (not a center's) as the session's user
export const POST = createPostRoute<{ liked: boolean; count: number }, { aid: string }>(
  async (request, { params }) => {
    const user = await requireMobileUser(request);
    const aid = parseAid((await params).aid);

    if (!(await getArticleByAid(aid))) throw new HttpError("المقال غير موجود", 404);
    return toggleArticleLike(aid, user.id);
  },
);
