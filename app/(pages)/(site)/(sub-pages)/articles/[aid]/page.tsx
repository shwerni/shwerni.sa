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
import { connection } from "next/server";
import { htmlToText } from "@/utils";
import { userServer } from "@/lib/auth/server";

// props
interface Props {
  params: Promise<{ aid: string }>;
}

const getProcessedArticle = async (aid: number) => {
  "use cache";
  cacheLife("days");

  const article = await getArticleByAid(aid);

  // validate
  if (!article) return null;

  const { body, side } = extractArticleSideFast(article.article);

  const plainText = htmlToText(article.article).trim();

  return {
    article,
    body,
    side,
    plainText,
  };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // aid
  const { aid } = await params;

  // get article
  const result = await getProcessedArticle(Number(aid));

  // validate
  if (!result) return { title: "المقال غير موجود" };

  const { article, plainText } = result;
  const writer = article.consultant?.name ?? "مستشارين شاورني";

  // SEO: rich description from actual content (160 chars max)
  const description = plainText.slice(0, 160).trimEnd();

  // SEO: specialty keywords
  const keywords = article.specialties.map((s) => s.specialty.name).join(", ");

  const canonicalUrl = `${mainRoute}articles/${aid}`;

  return {
    title: `${article.title} | شاورني - المدونة`,
    description,
    keywords,
    authors: [{ name: writer }],

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: `${article.title} | شاورني`,
      description,
      type: "article",
      url: canonicalUrl,
      locale: "ar_SA",
      siteName: "شاورني",
      images: [
        {
          url: article.image,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
      // SEO: article-specific OG fields
      publishedTime: article.created_at.toISOString(),
      authors: [writer],
      tags: article.specialties.map((s) => s.specialty.name),
    },

    twitter: {
      card: "summary_large_image",
      title: `${article.title} | شاورني`,
      description,
      images: [article.image],
    },

    icons: `${mainRoute}favicon.ico`,

    // SEO: robots directive
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
  };
}

export default async function Page({ params }: Props) {
  // connection() marks this route as dynamic.
  await connection();

  // user
  const userId = (await userServer())?.id || null;

  // aid
  const { aid } = await params;
  const articleId = Number(aid);

  // get article
  const result = await getProcessedArticle(articleId);

  // validate
  if (!result) return <Error404 />;

  // increment
  await incrementArticleRead(articleId);

  // seo
  const writer = result.article.consultant?.name ?? "مستشارين شاورني";

  // jsonLd
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: result.article.title,
    image: result.article.image,
    datePublished: result.article.created_at.toISOString(),
    author: { "@type": "Person", name: writer },
    publisher: {
      "@type": "Organization",
      name: "شاورني",
      logo: { "@type": "ImageObject", url: `${mainRoute}layout/logo.png` },
    },
    description: result.plainText.slice(0, 160),
    url: `${mainRoute}articles/${aid}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Article
        article={result.article}
        body={result.body}
        side={result.side}
        userId={userId}
      />
    </>
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
    if (!title) return;
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
