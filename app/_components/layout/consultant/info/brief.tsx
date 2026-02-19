// React & Next
import React from "react";

// components
import { Badge } from "@/components/ui/badge";
import { RateStarsReadOnly } from "@/app/_components/layout/rate";
import ConsultantImage from "@/app/_components/layout/consultant/image";

// utils
import { findCategory } from "@/utils";

// prisma types
import { Consultant } from "@/lib/generated/prisma/client";


// props
interface Props {
  consultant: Consultant;
}

const BriefConsultantInfo: React.FC<Props> = ({ consultant }: Props) => {
  // rate
  const rate = consultant.rate ?? 0;
  // return
  return (
    <div className="flex flex-col py-5 space-y-5">
      {/* consultant */}
      <div className="flex items-center gap-2 ">
        {/* consultant image */}
        <ConsultantImage image={consultant.image} gender={consultant.gender} />
        {/* consultant info */}
        <div className="space-y-1">
          <div className="flex flex-row items-center gap-2">
            {/* name */}
            <h3 className="text-xl">{consultant?.name}</h3>
            {/* rate */}
            {rate && (
              <div className="rflex gap-2">
                <RateStarsReadOnly rate={rate} />
              </div>
            )}
          </div>
          {/* subtitle */}
          <h5>{consultant?.title}</h5>
          {/* category */}
          <Badge className="bg-zgrey-50 text-zblack-100">
            {findCategory(consultant?.category)?.label}
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default BriefConsultantInfo;
