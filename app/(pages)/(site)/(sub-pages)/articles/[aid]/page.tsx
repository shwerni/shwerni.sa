// React & Next
import { Metadata } from "next";
import { connection } from "next/server";

// components
import Error404 from "@/components/shared/error-404";
import Article from "@/components/clients/articles/article/article";

// prisma data
import {
  getArticleByAid,
  getArticleLikes,
  incrementArticleRead,
} from "@/data/article";

// utils
import { htmlToText } from "@/utils";

// prisma data
import { cacheLife } from "next/cache";

// lib
import { userServer } from "@/lib/auth/server";

// seo
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbList } from "@/components/seo/breadcrumbs";
import { organizationId } from "@/components/seo/site-json-ld";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";

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

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني".
// a missing article (404) gets no metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // aid
  const { aid } = await params;
  const aidN = Number(aid);

  // get article
  const result = await getProcessedArticle(aidN);

  // validate
  if (!result) return {};

  const { article, plainText } = result;
  const writer = article.consultant?.name ?? "مستشارين شاورني";

  // SEO: rich description from actual content (160 chars max)
  const description = plainText.slice(0, 160).trimEnd();

  // SEO: specialty keywords
  const keywords = article.specialties.map((s) => s.specialty.name).join(", ");

  // the clean url, never with query params
  const canonicalUrl = `${mainRoute}articles/${aidN}`;

  return {
    title: article.title,
    description,
    keywords,
    authors: [{ name: writer }],

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      ...defaultMetaApi.openGraph,
      title: `${article.title} | شاورني`,
      description,
      type: "article",
      url: canonicalUrl,
      images: [{ url: article.image, alt: article.title }],
      // SEO: article-specific OG fields
      publishedTime: article.created_at.toISOString(),
      authors: [writer],
      tags: article.specialties.map((s) => s.specialty.name),
    },

    twitter: {
      ...defaultMetaApi.twitter,
      title: `${article.title} | شاورني`,
      description,
      images: [{ url: article.image, alt: article.title }],
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

  // user liked
  const like = await getArticleLikes(articleId, userId);

  // structured data: the article and the breadcrumb trail
  const url = `${mainRoute}articles/${articleId}`;
  const { article } = result;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Article",
              "@id": `${url}#article`,
              headline: article.title,
              description: result.plainText.slice(0, 160).trimEnd(),
              image: article.image,
              datePublished: article.created_at.toISOString(),
              // the consultant who wrote it, or shwerni when there is none
              author: article.consultant?.name
                ? { "@type": "Person", name: article.consultant.name }
                : { "@id": organizationId },
              publisher: { "@id": organizationId },
              inLanguage: "ar-SA",
              url,
              mainEntityOfPage: url,
            },
            breadcrumbList([
              { name: "مدونة المستشارين", path: "articles" },
              { name: article.title, path: `articles/${articleId}` },
            ]),
          ],
        }}
      />
      <Article
        article={result.article}
        body={result.body}
        side={result.side}
        userId={userId}
        liked={like?.liked}
        likes={like?.count}
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
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gis;
  const matches = [...html.matchAll(h3Regex)];
  const selected = matches.slice(-count);

  const side: { h3: string; p: string }[] = [];

  for (const match of selected) {
    const h3Text = match[1].replace(/<[^>]*>/g, "").trim();
    if (!h3Text) continue;

    const afterH3 = html.slice(html.indexOf(match[0]) + match[0].length);
    const nextH3Index = afterH3.search(/<h3/i);
    const content =
      nextH3Index === -1 ? afterH3 : afterH3.slice(0, nextH3Index);

    const text = content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    side.push({ h3: h3Text, p: text });
  }

  // remove selected h3s from body
  let body = html;
  for (const match of selected) {
    body = body.replace(match[0], "");
  }

  return { body, side };
}
