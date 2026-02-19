// React
import React from "react";

// components
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import StarBadge from "@/components/clients/shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// tpyes
import { Consultant } from "@/lib/generated/prisma/client";

// props
interface Props {
  consultant: Consultant;
  official?: boolean;
}

const ConsultantCard = ({ consultant, official }: Props) => {
  return (
    <Card className="gap-2 w-40 h-44 py-3 border-none">
      <CardHeader className="hidden">
        <CardDescription />
      </CardHeader>
      <CardContent className="flex flex-col px-4 my-1">
        {/* main info */}
        {/* image and badge */}
        <div className="flex flex-col items-center justify-start">
          <ConsultantImage
            name={consultant.name}
            image={official ? "/layout/logo-sm.png" : consultant.image}
            gender={consultant.gender}
            size="sm"
          />
          <StarBadge rate={consultant.rate} size="xs" variant="white" />
        </div>
        {/* name and info */}
        <div className="flex flex-col items-center gap-4 mt-2">
          {/* title and category */}
          <div className="space-y-1.5">
            <h3 className="text-[#094577] font-semibold mr-1">
              {official ? "مستشار شاورني" : consultant.name}
            </h3>
            <CategoryBadge category={consultant.category} size="xs" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsultantCard;
