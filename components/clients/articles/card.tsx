// React & Next
import Link from "next/link";
import Image from "next/image";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Stars from "@//components/clients/shared/stars";
// import { CategoryBadge } from "@/components/shared/categories-badge";

// utils
import { dateToString } from "@/utils/moment";
import { htmlToText, minutesToRead } from "@/utils";

// types
import { ArticleItem } from "@/types/layout";

// icons
import { BookOpen, Calendar } from "lucide-react";

const ArticleCard = ({ item }: { item: ArticleItem }) => {
  //  sanitized html
  const sanitized = htmlToText(item.article);

  // minutes to read
  const minutes = minutesToRead(item.length);

  return (
    <Link href={`/articles/${item.aid}`}>
      <Card className="block h-84 py-0! border-none w-72 sm:w-60 rounded-lg">
        <CardHeader className="p-0">
          <CardTitle className="hidden" />
          <CardDescription className="hidden" />
          <div className="relative aspect-square w-full h-40 overflow-hidden rounded-t-lg">
            {/* article image */}
            <Image
              src={item.image}
              alt="article-image"
              fill
              className="object-cover bg-slate-200"
            />
            {/* category badge */}
            {/* <CategoryBadge
              category={item.category}
              size="xs"
              className="absolute bottom-1 left-1 text-[0.7rem] px-3 py-0.5"
              label="category"
            /> */}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col justify-between h-40 pt-1 pb-0 px-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-4 text-gray-400" />
                <h6>{dateToString(item.created_at)}</h6>
              </div>
              <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                <BookOpen className="w-4 text-gray-400" />
                <h6>{minutes} دقائق للقراءة</h6>
              </div>
            </div>
            <h3 className="text-base text-[#094577] font-medium">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2">{sanitized}</p>
          </div>
          <div>
            {item.rate ? (
              <div className="flex justify-between items-center">
                <h6 className="text-gray-500 text-sm font-medium">
                  {item.name}
                </h6>
                <Stars rate={item.rate} width={80} />
              </div>
            ) : (
              <div className="relative w-full h-auto">
                <Image
                  src="/layout/logo.png"
                  alt="shwerni-logo"
                  width={80}
                  height={80}
                  priority={true}
                  sizes="(max-width: 640px) 144px, 256px"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ArticleCard;
