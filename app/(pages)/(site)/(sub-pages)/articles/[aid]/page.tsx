// React & Next
import { Metadata } from "next";

// packages
import * as cheerio from "cheerio";

// components
import Error404 from "@/components/shared/error-404";
import Article from "@/components/clients/articles/article/article";

// prisma data
import { getArticleByAid, incrementArticleRead } from "@/data/article";

// prisma data
import { cacheLife } from "next/cache";

// prisma types
import { mainRoute } from "@/constants/links";

// props
interface Props {
  params: Promise<{ aid: string }>;
}

const getProcessedArticle = async (aid: number) => {
  "use cache";
  cacheLife("days");

  const article = await getArticleByAid(aid);
  if (!article) return null;

  const { body, side } = extractArticleSideFast(article.article);

  return {
    article,
    body,
    side,
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // aid
  const { aid } = await params;
  // get article
  const result = await getProcessedArticle(Number(aid));

  // validate
  if (!result) return { title: "المقال غير موجود" };

  const { article } = result;
  const writer = article.consultant?.name ?? "مستشارين شاورني";

  return {
    title: `${article.title} شاورني - المدونة`,
    description: `شاورني - المدونة ${article.title} - ${writer}`,
    openGraph: {
      title: `${article.title} شاورني - المدونة`,
      type: "website",
      url: `${mainRoute}articles/${aid}`,
      images: [{ url: article.image }],
    },
    twitter: {
      card: "summary_large_image",
      images: [article.image],
    },
    icons: `${mainRoute}favicon.ico`,
  };
}

export default async function Page({ params }: Props) {
  // aid
  const { aid } = await params;
  const articleId = Number(aid);

  // get article
  const result = await getProcessedArticle(articleId);

  // validate
  if (!result) return <Error404 />;

  // increment
  await incrementArticleRead(articleId);

  return (
    <Article article={result.article} body={result.body} side={result.side} />
  );
}

// side info extractions
function extractArticleSideFast(
  html: string,
  count = 3,
): {
  body: string;
  side: { h3: string; p: string }[];
} {
  const $ = cheerio.load(html);

  const h3Elements = $("h3").toArray();
  const selected = h3Elements.slice(-count);

  const side: { h3: string; p: string }[] = [];

  selected.forEach((h3) => {
    const $h3 = $(h3);
    const title = $h3.text().trim();

    let text = "";
    let next = $h3.next();

    while (next.length && next[0].tagName !== "h3") {
      const t = next.text().trim();
      if (t) text += text ? "\n" + t : t;
      next = next.next();
    }

    side.push({ h3: title, p: text });
  });

  selected.forEach((h3) => $(h3).remove());

  return {
    body: $("body").html() ?? "",
    side,
  };
}
