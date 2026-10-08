// React & Next
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

// components
import Stars from "../../shared/stars";
import ArticleComments from "../comments";
import {
  ArticleCommentForm,
  ArticleLike,
  ArticleLikeFallback,
  ArticleReadTracker,
} from "./viewer";
import { Badge } from "@/components/ui/badge";
import CopyButton from "@/components/shared/copy-button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ShareButtons from "@/components/shared/share-buttons";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ArticleSideInfo from "@/components/clients/articles/article/side-info";
import { ArticleFaq, type ArticleFaqItem } from "@/components/clients/articles/article/faq";
import Recommendation from "@/components/clients/articles/article/recommendation";

// css
import "@/styles/article.css";

// utils
import { consultantGenderLabel, minutesToRead } from "@/utils";
import { riyadhDateString } from "@/utils/date";

// prisma types
import {
  Article as ArticlePrisma,
  Gender,
  Specialty,
} from "@/lib/generated/prisma/client";

// constant
import { mainRoute } from "@/constants/links";

// icons
import { ExternalLink, Newspaper, PenTool } from "lucide-react";
// header icons: plain server svgs (above the fold, nothing to hydrate)
import { serverIcon } from "@/components/shared/server-icon";
import { __iconNode as bookOpenNode } from "lucide-react/dist/esm/icons/book-open.mjs";
import { __iconNode as calendar1Node } from "lucide-react/dist/esm/icons/calendar-1.mjs";
import { __iconNode as eyeNode } from "lucide-react/dist/esm/icons/eye.mjs";

const BookOpen = serverIcon("book-open", bookOpenNode);
const Calendar1 = serverIcon("calendar-1", calendar1Node);
const Eye = serverIcon("eye", eyeNode);

type ArtilceType = ArticlePrisma & {
  // types
  specialties: { specialty: Specialty }[];
} & {
  consultant: {
    name: string;
    rate: number;
    gender: Gender;
  } | null;
} & {
  faqs: ArticleFaqItem[];
};

// props
// cached article data only: per-user parts (likes, session) stream in their own suspense
interface Props {
  article: ArtilceType;
  body: string;
  side: {
    h3: string;
    p: string;
  }[];
}

const Article = async ({ article, body, side }: Props) => {
  return (
    <article className="my-5 px-3 space-y-8">
      {/* view counter: runs after the response, request time only */}
      <Suspense fallback={null}>
        <ArticleReadTracker aid={article.aid} />
      </Suspense>
      {/* content */}
      <div className="flex flex-col md:grid grid-cols-8 gap-x-2 gap-y-5">
        {/* right side */}
        <div className="md:col-span-5 space-y-5">
          <h1 className="text-theme-700 text-2xl sm:text-3xl font-semibold">
            {article.title}
          </h1>
          {/* image */}
          <AspectRatio ratio={16 / 7} className="rounded-sm">
            {/* article image */}
            <Image
              src={article.image}
              alt={article.title}
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover rounded"
            />
          </AspectRatio>
          {/* info */}
          <header className="flex items-center gap-3 md:gap-5 bg-theme-25 py-4 px-2 md:px-3 rounded-sm">
            <div className="relative">
              <Image
                src="/layout/logo.png"
                alt="shwerni-logo"
                width={75}
                height={75}
                sizes="(max-width: 640px) 144px, 256px"
              />
            </div>
            <time
              dateTime={article.created_at.toISOString()}
              className="inline-flex items-center gap-1 text-gray-500"
            >
              <Calendar1 className="w-3 md:w-4" />
              <span className="text-[0.7rem] md:text-xs">
                {riyadhDateString(article.created_at)}
              </span>
            </time>
            <div className="inline-flex items-center gap-1 text-gray-500">
              <BookOpen className="w-3 md:w-4" />
              <span className="text-[0.7rem] md:text-xs">
                {minutesToRead(article.article.length)} دقائق للقراءة
              </span>
            </div>
            <div className="inline-flex items-center gap-1 text-gray-500">
              <Eye className="w-3 md:w-4" />
              <span className="text-[0.7rem] md:text-xs">
                {/* dynamic later */}
                {article.read.toLocaleString()} قراءة
              </span>
            </div>
          </header>
          {/* specialities */}
          <nav className="flex flex-wrap items-center gap-3">
            {article.specialties.map((i) => (
              <Badge key={i.specialty.id} variant="secondary">
                {i.specialty.name}
              </Badge>
            ))}
          </nav>
          {/* article */}
          <section
            dangerouslySetInnerHTML={{ __html: body }}
            className="article-content prose prose-sm max-w-none"
          />
          {/* faq: part of the cached article content (no streamed boundary of its own) */}
          <ArticleFaq aid={article.aid} faqs={article.faqs} />
          {/* consultant */}
          <ConsultantAuthor
            consultant={article.consultant}
            consultantId={article.consultantId}
          />
          {/* share buttons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 py-4 px-2">
              <ShareButtons
                title={article.title}
                url={mainRoute + "articles/" + article.aid}
              />
              <CopyButton
                variant="transparent"
                value={article.article}
                hideLabel={true}
              />
            </div>
            <Suspense fallback={<ArticleLikeFallback aid={article.aid} />}>
              <ArticleLike aid={article.aid} />
            </Suspense>
          </div>
          {/* consultant */}
        </div>
        {/* left side: desktop */}
        <div className="article-side hidden md:block col-span-3">
          {side.length > 0 && <ArticleSideInfo side={side} />}
        </div>
      </div>

      {/* comments & recommendation */}
      <div className="xl:flex  xl:gap-4">
        {/* comments */}
        <div className="flex-1 max-w-xl">
          <Suspense fallback={<CardSkeleton count={3} />}>
            <ArticleCommentForm aid={article.aid} />
            <ArticleComments aid={article.aid} />
          </Suspense>
        </div>

        {/* footer */}
        <div className="space-y-6">
          <Suspense fallback={<CardSkeleton count={3} />}>
            <Recommendation />
          </Suspense>
        </div>
      </div>

      {/* article info: mobile */}
      <div className="md:hidden space-y-5">
        <div className="inline-flex items-center gap-1.5">
          <Newspaper className="w-4 text-theme-700" />
          <h3 className="text-theme-700 font-semibold">معلومات قد تهمك</h3>
        </div>
        {side.length > 0 && (
          <div className="article-side">
            <ArticleSideInfo side={side} />
          </div>
        )}
      </div>
    </article>
  );
};

export default Article;

const ConsultantAuthor = ({
  consultant,
  consultantId,
}: {
  consultantId: number | null;
  consultant: {
    name: string;
    rate: number;
    gender: Gender;
  } | null;
}) => {
  // validate
  if (!consultant || !consultantId) return null;

  return (
    <Link
      href={`/consultants/${consultantId}`}
      className="group flex flex-row justify-between items-center w-full p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100 transition-all duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 group-hover:bg-theme/10 transition-colors duration-200">
          <PenTool className="w-4 h-4 text-gray-500 group-hover:text-theme transition-colors" />
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-gray-500 font-medium mb-0.5">
            إعداد وكنابة ال{consultantGenderLabel(consultant.gender)}
          </span>
          <h6 className="text-sm font-bold text-theme">{consultant.name}</h6>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Stars rate={consultant.rate} />
        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-theme transition-colors rtl:-scale-x-100" />
      </div>
    </Link>
  );
};
