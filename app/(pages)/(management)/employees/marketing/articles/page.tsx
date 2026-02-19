"use server";
// components
import { ALLArticles } from "@/app/_components/management/layout/articles";

// prisma data
import { getAllArticlesAdmin } from "@/data/admin/article";

// primsa types
import { UserRole } from "@/lib/generated/prisma/enums";

export default async function Page() {
  // get articles
  const articles = (await getAllArticlesAdmin()) ?? [];

  // return
  return <ALLArticles articles={articles} role={UserRole.MARKETER} />;
}
