// React & Next
import Image from "next/image";
import { Suspense } from "react";

// components
import { ArticleLikeButton } from "./like";
import { Badge } from "@/components/ui/badge";
import CopyButton from "@/components/shared/copy-button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import ShareButtons from "@/components/shared/share-buttons";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import ArticleSideInfo from "@/components/clients/articles/article/side-info";
import Recommendation from "@/components/clients/articles/article/recommendation";

// css
import "@/styles/article.css";

// utils
import { minutesToRead } from "@/utils";
import { dateToString } from "@/utils/moment";

// prisma types
import {
  Article as ArticlePrisma,
  Specialty,
} from "@/lib/generated/prisma/client";

// constant
import { mainRoute } from "@/constants/links";

// icons
import { BookOpen, Calendar1, Eye, Newspaper } from "lucide-react";

type ArtilceType = ArticlePrisma & {
  // types
  specialties: { specialty: Specialty }[];
} & {
  consultant: {
    name: string;
  } | null;
};

// props
interface Props {
  article: ArtilceType;
  body: string;
  liked: boolean;
  likes: number;
  userId: string | null;
  side: {
    h3: string;
    p: string;
  }[];
}

const Article = async ({
  article,
  userId,
  body,
  side,
  liked,
  likes,
}: Props) => {
  return (
    <article className="my-5 px-3 space-y-8">
      {/* content */}
      <div className="flex flex-col md:grid grid-cols-8 gap-x-2 gap-y-5">
        {/* right side */}
        <div className="md:col-span-5 space-y-5">
          <h1 className="text-[#094577] text-2xl sm:text-3xl font-semibold">
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
              sizes="(max-width: 768px) 100vw, 66vw"
              className="object-cover rounded"
            />
          </AspectRatio>
          {/* info */}
          <header className="flex items-center gap-3 md:gap-5 bg-[#F1F8FE] py-4 px-2 md:px-3 rounded-sm">
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
                {dateToString(article.created_at)}
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
            <ArticleLikeButton
              aid={article.aid}
              userId={userId}
              liked={liked}
              iLikes={likes}
            />
          </div>
        </div>
        {/* left side: desktop */}
        <div className="article-side hidden md:block col-span-3">
          {side.length > 0 && <ArticleSideInfo side={side} />}
        </div>
      </div>
      {/* footer */}
      <div className="space-y-8">
        <Suspense fallback={<CardSkeleton count={3} />}>
          <Recommendation />
        </Suspense>
      </div>
      {/* article info: mobile */}
      <div className="md:hidden space-y-5">
        <div className="inline-flex items-center gap-1.5">
          <Newspaper className="w-4 text-[#094577]" />
          <h3 className="text-[#094577] font-semibold">معلومات قد تهمك</h3>
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
