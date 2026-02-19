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
import { LinkButton } from "@/components/shared/link-button";
import StarBadge from "@/components/clients/shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// utils
import { minutesToRead } from "@/utils";
import { dateToString } from "@/utils/moment";

// prisma data
import { getRecommendedConsultants, getSimilarArticles } from "@/data/article";

// icons
import {
  BookOpen,
  Calendar,
  CalendarDays,
  Newspaper,
  UsersRound,
} from "lucide-react";

const Recommendation = async () => {
  const articles = await getSimilarArticles();
  const consultants = await getRecommendedConsultants();

  return (
    <>
      {/* consultant */}
      <div>
        <div className="inline-flex items-center gap-1.5">
          <UsersRound className="text-[#094577] w-4" />
          <h3 className="text-[#094577] font-semibold">
            مستشارون مقترحون لإرشادك
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {consultants.map((i) => (
            <Card key={i.cid} className="w-10/12 sm:w-54 py-0! border-none">
              <CardHeader className="hidden">
                <CardTitle />
                <CardDescription />
              </CardHeader>
              <CardContent className="px-3 py-4 space-y-7">
                <div className="flex items-center justify-start gap-4">
                  {/* image & rate */}
                  <div className="relative">
                    <ConsultantImage
                      size="base"
                      variant="avatar"
                      name={i.name}
                      image={i.image}
                      gender={i.gender}
                    />
                    <StarBadge
                      rate={i.rate}
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2"
                      variant="white"
                      size="xs"
                    />
                  </div>
                  {/* title & category */}
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm text-[#094577] font-semibold">
                      {i.name}
                    </h3>
                    <CategoryBadge category={i.category} size="sm" />
                  </div>
                </div>
                {/* reserve */}
                <LinkButton
                  href={"/consultants/" + i.cid}
                  variant="primary"
                  className="w-full gap-2"
                >
                  <CalendarDays className="text-white w-4" />
                  احجز موعدك الآن
                </LinkButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* articles */}
      <div>
        <div className="inline-flex items-center gap-1.5">
          <Newspaper className="text-[#094577] w-4" />
          <h3 className="text-[#094577] font-semibold">مقالات قد تعجبك</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {articles.map((i) => (
            <Link href={`/articles/${i.aid}`} key={i.aid}>
              <Card className="block h-60 py-0! border-none w-80 sm:w-64 rounded-lg">
                <CardHeader className="p-0">
                  <CardTitle className="hidden" />
                  <CardDescription className="hidden" />
                  <div className="relative aspect-square w-full h-34 overflow-hidden rounded-t-lg">
                    {/* article image */}
                    <Image
                      src={i.image}
                      alt="article-image"
                      fill
                      className="object-cover bg-slate-200"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col justify-between h-40 pt-1 pb-0 px-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-4 text-gray-400" />
                        <h6>{dateToString(i.created_at)}</h6>
                      </div>
                      <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <BookOpen className="w-4 text-gray-400" />
                        <h6>{minutesToRead(i.length)} دقائق للقراءة</h6>
                      </div>
                    </div>
                    <h3 className="text-base text-[#094577] font-medium">
                      {i.title}
                    </h3>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Recommendation;
