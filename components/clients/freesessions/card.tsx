// React & Next
import Link from "next/link";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StarBadge from "../shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// types
import { ConsultantItem } from "@/data/consultant";

// props
interface Props {
  consultant: ConsultantItem;
}

const ConsultantCard = ({ consultant }: Props) => {
  return (
    <Link href={`/event/${consultant.cid}`}>
      <Card className="h-64 w-44 py-3 border-none rounded-lg px-0!">
        <CardHeader className="hidden">
          <CardTitle className="hidden" />
          <CardDescription className="hidden" />
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-between gap-3 h-11/12 px-0!">
          {/* consultant image */}
          <div className="relative">
            <ConsultantImage
              name={consultant.name}
              image={consultant.image}
              gender={consultant.gender}
            />
            {consultant.rate && consultant.rate > 0 ? (
              <StarBadge
                rate={consultant.rate}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2"
                size="xs"
                variant="white"
              />
            ) : (
              ""
            )}
          </div>
          {/* name & category */}
          <div className="flex flex-col items-center gap-2">
            <h3 className="text-[1.1rem] text-[#094577] font-medium">
              {consultant.name}
            </h3>
            {/* category badge */}
            <CategoryBadge category={consultant.category} size="sm" />
          </div>
          {/* experince & rates */}
          <div className="inline-flex items-center gap-3">
            <h6 className="text-xs font-medium text-gray-500">
              خبرة {consultant.years > 0 ? consultant.years : 1} سنوات
            </h6>

            {consultant.review_count && consultant.review_count > 0 ? (
              <h6 className="text-xs font-medium text-gray-500">
                {consultant.review_count} مرجعات
              </h6>
            ) : (
              ""
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ConsultantCard;
