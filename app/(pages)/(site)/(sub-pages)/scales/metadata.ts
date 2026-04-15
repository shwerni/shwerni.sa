import { mainRoute } from "@/constants/links";
import type { Metadata } from "next";

const siteName = "شاورني";
const siteHandle = "@shwernisa";
const siteUrl = mainRoute;
const ogImage = `${siteUrl}layout/shwerni.jpg`;

// ── Listing page metadata ────────────────────────────────────────────────────

export const scalesListMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "المقاييس النفسية والأسرية",
  description:
    "اكتشف نفسك من خلال مقاييس نفسية وأسرية موثوقة — قياس القلق، التوافق الزواجي، الاكتئاب، والمزيد.",
  keywords: [
    "مقاييس نفسية",
    "مقياس القلق",
    "مقياس الاكتئاب",
    "مقياس التوافق الزواجي",
    "اختبارات نفسية",
    "اختبار الشخصية",
    "تقييم نفسي",
    "GAD-7",
    "PHQ-9",
    "شاورني",
  ],
  alternates: {
    canonical: `${siteUrl}مقاييس`,
    languages: { "ar-SA": `${siteUrl}مقاييس` },
  },
  openGraph: {
    type: "website",
    url: `${siteUrl}مقاييس`,
    siteName,
    locale: "ar_SA",
    title: `المقاييس النفسية والأسرية | ${siteName}`,
    description:
      "اكتشف نفسك من خلال مقاييس نفسية وأسرية موثوقة — قياس القلق، التوافق الزواجي، الاكتئاب، والمزيد.",
    images: [{ url: ogImage, alt: siteName, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    site: siteHandle,
    creator: siteHandle,
    title: `المقاييس النفسية والأسرية | ${siteName}`,
    description:
      "اكتشف نفسك من خلال مقاييس نفسية وأسرية موثوقة.",
    images: [{ url: ogImage, alt: siteName, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

// ── Dynamic scale page metadata factory ─────────────────────────────────────

interface ScaleMetaParams {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  slug: string;
}

export function buildScaleMetadata({
  title,
  subtitle,
  description,
  slug,
}: ScaleMetaParams): Metadata {
  const fullTitle = subtitle ? `${title} (${subtitle})` : title;
  const desc =
    description?.slice(0, 155) ??
    `${title} — اجب على الأسئلة واكتشف نتيجتك مجاناً على منصة شاورني.`;

  const pageUrl = `${siteUrl}مقاييس/${slug}`;

  return {
    metadataBase: new URL(siteUrl),
    title: fullTitle,
    description: desc,
    keywords: [title, subtitle ?? "", "مقياس نفسي", "اختبار نفسي", "شاورني"].filter(Boolean),
    alternates: {
      canonical: pageUrl,
      languages: { "ar-SA": pageUrl },
    },
    openGraph: {
      type: "website",
      url: pageUrl,
      siteName,
      locale: "ar_SA",
      title: `${fullTitle} | ${siteName}`,
      description: desc,
      images: [{ url: ogImage, alt: fullTitle, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      site: siteHandle,
      creator: siteHandle,
      title: `${fullTitle} | ${siteName}`,
      description: desc,
      images: [{ url: ogImage, alt: fullTitle, width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
  };
}

// ── Result page metadata factory ─────────────────────────────────────────────

export function buildResultMetadata(scaleTitle: string, slug: string): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: `نتيجة ${scaleTitle}`,
    description: `اطّلع على نتيجة ${scaleTitle} الخاصة بك واعرف توصياتنا لك.`,
    robots: { index: false, follow: false }, // results are personal — no indexing
    alternates: {
      canonical: `${siteUrl}مقاييس/${slug}/نتيجة`,
    },
  };
}