// React & Next
import { Metadata } from "next";
import { notFound } from "next/navigation";

// components
import Article from "@/components/clients/articles/article/article";

// prisma data
import { getArticleByAid } from "@/data/article";

// utils
import { htmlToText } from "@/utils";

// prisma data
import { cacheLife, cacheTag } from "next/cache";

// seo
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbList } from "@/components/seo/breadcrumbs";
import { organizationId, websiteId } from "@/components/seo/site-json-ld";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";

// props
interface Props {
  params: Promise<{ aid: string }>;
}

// no generateStaticParams: prerendering every article at build time put two outlined
// segments (the loading.tsx boundaries) in the static html with the same ids ("S:7", "S:8")
// that the request-time holes reuse. react's batched reveal can then move the whole page into
// the comment form's slot, and hydration fails and retries forever (cpu pinned, memory grows).
// the article stays cached ("use cache" below); per-user and per-view parts still stream in
// their own suspense boundaries (article/viewer.tsx)

const getProcessedArticle = async (aid: number) => {
  "use cache";
  cacheLife("days");
  // the dashboard refreshes one article (article:<aid>) or every article and the sitemap
  // (articles) through /api/revalidate after an edit; the days lifetime is the fallback
  cacheTag("articles", `article:${aid}`);

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
    // meta description and json-ld description: the start of the article, cut at a word
    description: describe(plainText),
    // the last content change, or the publish date while updated_at is still null
    modifiedAt: article.updated_at ?? article.created_at,
  };
};

// the first 160 characters, cut at a word boundary
function describe(text: string, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

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

  const { article, description, modifiedAt } = result;
  const writer = article.consultant?.name ?? "مستشارين شاورني";

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
      modifiedTime: modifiedAt.toISOString(),
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
  // aid
  const { aid } = await params;
  const articleId = Number(aid);

  // get article (cached)
  const result = await getProcessedArticle(articleId);

  // a missing or unpublished article answers 404 (the site not-found page)
  if (!result) notFound();

  // structured data, one graph for the page: the article, its faq (when it has one) and the
  // breadcrumb trail. the FAQPage is the page itself (its @id is the article url) and lists
  // exactly the questions and answers the faq section shows
  const url = `${mainRoute}articles/${articleId}`;
  const { article } = result;
  const hasFaq = article.faqs.length > 0;

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
              description: result.description,
              image: article.image,
              datePublished: article.created_at.toISOString(),
              dateModified: result.modifiedAt.toISOString(),
              // the consultant who wrote it (with the profile the page links to), or shwerni
              author:
                article.consultant?.name && article.consultantId
                  ? {
                      "@type": "Person",
                      name: article.consultant.name,
                      url: `${mainRoute}consultants/${article.consultantId}`,
                    }
                  : { "@id": organizationId },
              publisher: { "@id": organizationId },
              inLanguage: "ar-SA",
              url,
              mainEntityOfPage: hasFaq ? { "@id": url } : url,
            },
            ...(hasFaq
              ? [
                  {
                    "@type": "FAQPage" as const,
                    "@id": url,
                    url,
                    name: article.title,
                    inLanguage: "ar-SA",
                    isPartOf: { "@id": websiteId },
                    mainEntity: article.faqs.map((faq) => ({
                      "@type": "Question" as const,
                      name: faq.question,
                      acceptedAnswer: {
                        "@type": "Answer" as const,
                        text: faq.answer,
                      },
                    })),
                  },
                ]
              : []),
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
