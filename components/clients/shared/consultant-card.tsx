// React
import React from "react";

// packages
import { differenceInYears } from "date-fns";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import SvgIcon from "@/components/shared/svg-icon";
import StarBadge from "@/components/clients/shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import ConsultantSpecialties from "@/components/clients/shared/consultant-specialties";

// lib
import { timeZone } from "@/lib/site/time";

// tpyes
import { ConsultantCard as ConsultantCardType } from "@/types/layout";

// icons

// props
interface Props extends React.HTMLAttributes<HTMLDivElement> {
  consultant: ConsultantCardType;
}

const ConsultantCard = ({ consultant }: Props) => {
  return (
    <Card className="gap-2 w-72 h-48 py-3 border-none">
      <CardHeader className="hidden">
        <CardDescription />
      </CardHeader>
      <CardContent className="flex flex-col px-4 my-1">
        {/* main info */}
        <div className="flex items-start gap-3">
          {/* image and badge */}
          <div className="flex flex-col items-center justify-start gap-3">
            <ConsultantImage
              name={consultant.name}
              image={consultant.image}
              gender={consultant.gender}
              size="sm"
            />
            <StarBadge rate={consultant.rate} size="xs" />
          </div>
          {/* name and info */}
          <div className="flex flex-col gap-4 mt-2">
            {/* title and category */}
            <div className="space-y-1.5">
              <h3 className="text-[#094577] font-semibold mr-1">
                {consultant.name}
              </h3>
              <CategoryBadge category={consultant.category} size="xs" />
            </div>
            {/* info */}
            <div className="space-y-2">
              {/* experience */}
              <div className="flex items-center gap-1.5">
                <SvgIcon
                  src="/svg/icons/consultant-card-medal.svg"
                  className="w-3.5 text-slate-400"
                />
                <h5 className="text-slate-400 text-xs">
                  خبرة {consultant.years} سنوات
                </h5>
              </div>
              {/* reviews */}
              {Number(consultant.reviews) > 0 && (
                <div className="flex items-center gap-1.5">
                  <SvgIcon
                    src="/svg/icons/consultant-card-star.svg"
                    className="w-3.5 text-slate-400"
                  />
                  <h5 className="text-slate-400 text-xs">
                    {Number(consultant.reviews)} مراجعات
                  </h5>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      {/* specialisation */}
      <CardFooter className="pt-1 pb-3 px-2">
        <ConsultantSpecialties specialties={consultant.specialties} />
      </CardFooter>
    </Card>
  );
};

export default ConsultantCard;
