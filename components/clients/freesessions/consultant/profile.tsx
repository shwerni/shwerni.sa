// React & Next
import React from "react";

// lib
import { Consultant } from "@/lib/generated/prisma/client";

// types
import { User } from "next-auth";

// components
import StarBadge from "../../shared/star-badge";
import { Separator } from "@/components/ui/separator";
import Stars from "@/components/clients/shared/stars";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { TbBulb } from "react-icons/tb";

// props
interface Props {
  user?: User;
  // prettier-ignore
  consultant: 
  Consultant 
  & { years: number }
  & { reviews: number } 
  & { specialties: string[] };
}

const FreeSessionProfile: React.FC<Props> = ({ consultant }: Props) => {
  return (
    <div className="flex flex-col gap-4 w-10/12 max-w-2xl mx-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md py-3 px-2">
      <div className="flex items-start gap-2">
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
        {/* name & category & rate */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-[1.1rem] text-[#094577] font-medium">
            {consultant.name}
          </h3>
          {/* category badge */}
          <CategoryBadge category={consultant.category} size="sm" />
          {/* rate */}
          {consultant.rate > 0 && consultant.reviews ? (
            <div className="flex items-center gap-2.5">
              {/* stars */}
              <Stars rate={consultant.rate} width={85} />
              {/* rate count and value */}
              <div className="space-x-1.5">
                {/* rate value */}
                <span className="text-base text-gray-800 font-bold">
                  {consultant.rate.toFixed(1)}
                </span>
                {/* rate count */}
                <span className="text-gray-400 text-sm">
                  ({consultant.reviews})
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/* separator */}
      <Separator className="w-10/12 mx-auto max-w-lg" />
      {/* about */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5">
          <TbBulb className="text-theme w-6 h-6" />
          <h3 className="text-lg font-semibold text-[#094577]">
            نبذة عن الاستشاري
          </h3>
        </div>
        <p className="text-xs font-medium text-gray-500">{consultant.nabout}</p>
      </div>
    </div>
  );
};

export default FreeSessionProfile;
