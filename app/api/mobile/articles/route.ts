// packages
import { z } from "zod";

// utils
import { htmlToText, minutesToRead } from "@/utils";
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// prisma data
import { getMobileArticles } from "@/data/mobile/articles";

// prisma types
import type { Categories } from "@/lib/generated/prisma/enums";

interface PublicArticle {
  aid: number;
  title: string;
  excerpt: string;
  minutes: number;
  reads: number;
  image: string;
  category: Categories;
  createdAt: string;
  likes: number;
  consultant: { name: string; rate: number | null } | null;
}

const QuerySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(24).default(9),
  search: z.string().trim().max(100).optional(),
  category: z.enum(["FAMILY", "PSYCHIC", "LAW", "PERSONAL"]).optional(),
  orderby: z.enum(["newest", "viral"]).default("newest"),
});

// the app's article list (home carousel, المدونة): public fields only, the body never sent
export const GET = createGetRoute<{ items: PublicArticle[]; nextCursor: string | null }>(
  async (request) => {
    await requireMobileUser(request);

    const parsed = QuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const q = parsed.data;

    const { items, page, pages } = await getMobileArticles(
      q.cursor ?? 1,
      q.search ?? "",
      q.orderby,
      q.pageSize,
      q.category,
    );

    return {
      items: items.map((row) => ({
        aid: row.aid,
        title: row.title,
        excerpt: htmlToText(row.article),
        minutes: minutesToRead(Number(row.length)),
        reads: row.read,
        image: row.image,
        category: row.category,
        createdAt: new Date(row.created_at).toISOString(),
        likes: Number(row.likes_count),
        consultant: row.name ? { name: row.name, rate: row.rate } : null,
      })),
      nextCursor: page < pages ? String(page + 1) : null,
    };
  },
);
