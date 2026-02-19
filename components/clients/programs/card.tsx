// React
import React from "react";
import Image from "next/image";

// components
import Stars from "../shared/stars";
import CurrencyLabel from "../shared/currency-label";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { IconLabel } from "@/components/shared/icon-label";
import { LinkButton } from "@/components/shared/link-button";

// icons
import { ChevronLeft, Clock, Video } from "lucide-react";

// utils
import { findCategory } from "@/utils";

// types
import { Program } from "@/lib/generated/prisma/client";

// props
interface Props extends React.HTMLAttributes<HTMLDivElement> {
  program: Program;
}

const ProgramCard = ({ program }: Props) => {
  return (
    <Card className="w-80 border-b-2 border-t-0 border-x-0 pt-0 pb-3 rounded-lg overflow-hidden shadow-sm">
      {/* Image */}
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <Image
            src={program.image}
            alt={program.title || "برنامج استشاري"}
            fill
            className="object-cover"
          />
        </AspectRatio>

        {/* category overlay */}
        <h5 className="absolute bottom-2 right-2 text-white text-sm font-medium z-10">
          برنامج {findCategory(program.category)?.category}
        </h5>
      </div>

      {/* Details */}
      <CardContent className="px-4 space-y-4">
        <div className="flex items-center gap-1">
          <Stars rate={5} color="#DBA102" />
          <span className="text-xs text-gray-700">{(5).toFixed(1)}</span>
        </div>
        {/* title & info */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-[#1F2A37]">
            {program.title}
          </h3>
          <div className="flex justify-between items-center w-full bg-gray-100 px-3 py-1 mx-auto rounded-sm">
            {[
              { label: program.duration + " دقيقة", icon: Clock },
              { label: program.sessions + " جلسات", icon: Video },
            ].map((i, index) => (
              <div key={index} className="flex items-center gap-2">
                <i.icon className="w-4 text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">
                  {i.label}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* cost */}
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col gap-0.5">
            <div className="inline-flex items-center gap-2">
              <CurrencyLabel
                amount={program.price}
                className="text-xl font-bold"
                tax={15}
              />
              <h6 className="text-gray-500 font-light text-xs">شامل الضريبة</h6>
            </div>
            <span className="text-sm text-gray-400">
              بدلاً من{" "}
              <CurrencyLabel
                amount={program.price}
                className="line-through"
                size="xs"
                tax={50}
              />
            </span>
          </div>
          {/* Reserve */}
          <LinkButton
            href={`/programs/${program.prid}`}
            variant="primary"
            size="sm"
          >
            <IconLabel label="اشترك الآن" Icon={ChevronLeft} size="sm" />
          </LinkButton>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramCard;
