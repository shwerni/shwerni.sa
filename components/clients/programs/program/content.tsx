// React & Next
import React from "react";
import Image from "next/image";

// components
import { Badge } from "@/components/ui/badge";
import StarBadge from "../../shared/star-badge";
import Stars from "@/components/clients/shared/stars";
import CurrencyLabel from "../../shared/currency-label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { IconLabel } from "@/components/shared/icon-label";
import ConsultantImage from "../../shared/consultant-image";
import ShareButtons from "@/components/shared/share-buttons";
import { LinkButton } from "@/components/shared/link-button";

// lib
import { Consultant, Program } from "@/lib/generated/prisma/client";

// utils
import { findCategory } from "@/utils";

// types
import { User } from "next-auth";

// constant
import { mainRoute } from "@/constants/links";

// icons
import { IoIosCheckmarkCircle } from "react-icons/io";
import { Clock, Goal, MoveLeft, Video } from "lucide-react";

// props
interface Props {
  user?: User;
  // prettier-ignore
  program:
  Program & {
    consultants: Pick<Consultant, "name" | "image"| "category" | "gender"| "rate">[]
  };
}

const ProgramContent: React.FC<Props> = ({ program }: Props) => {
  return (
    <div className="max-w-4xl px-3 sm:px-5 mx-auto space-y-5">
      {/* image */}
      <AspectRatio ratio={16 / 7} className="rounded">
        {/* article image */}
        <Image
          src={program.image}
          alt="article-image"
          fill
          className="object-cover rounded"
        />
      </AspectRatio>
      {/* rate */}
      <div className="flex items-center gap-1">
        <Stars rate={5} color="#DBA102" />
        <span className="text-xs text-gray-700">{(5).toFixed(1)}</span>
      </div>

      {/* about & summray */}
      <div className="flex flex-col md:grid grid-cols-6 gap-x-4 gap-y-5 pb-8">
        {/* about program */}
        <div className="md:col-span-4 space-y-5">
          {/* description */}
          <div className="space-y-3">
            <h3 className="text-base text-gray-700 font-medium">
              حول البرنامج
            </h3>
            <p className="sm:w-10/12 text-sm font-medium">{program.description}</p>
          </div>
          {/* topics */}
          <div className="space-y-3">
            <h3 className="text-base text-gray-700 font-medium">
              محاور الجلسات
            </h3>
            <div className="px-3 space-y-2">
              {program.features.map((i, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <IoIosCheckmarkCircle className="text-green-700" />
                  <h6 className="text-xs font-medium text-gray-700">{i}</h6>
                </div>
              ))}
            </div>
          </div>
          {/* topics */}
          <div className="space-y-3">
            <h3 className="text-base text-gray-700 font-medium">
              المهارت التي ستكتسبها
            </h3>
            <div className="flex flex-wrap items-center gap-4 px-4 space-y-2">
              {program.mastered.map((i, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs font-medium"
                >
                  {i}
                </Badge>
              ))}
            </div>
          </div>
          {/* share url */}
          <div className="space-y-5">
            <h3 className="text-base text-gray-700 font-medium">
              شارك هذا البرنامج
            </h3>

            <ShareButtons
              title={program.title}
              url={mainRoute + "programs/" + program.prid}
              className="px-5"
            />
          </div>
        </div>
        {/* program summary & consultant */}
        <div className="col-span-2">
          <div className="w-11/12 max-w-2xl bg-[#F1F8FE] py-6 px-3  mx-auto space-y-6 rounded-sm">
            {/* cost */}
            <div className="flex flex-col gap-0.5">
              <div className="inline-flex items-center gap-2">
                <CurrencyLabel
                  amount={program.price}
                  className="text-2xl font-bold"
                  tax={15}
                />
                <h6 className="text-gray-500 font-light text-xs">
                  شامل الضريبة
                </h6>
              </div>
              <span className="text-base text-gray-400">
                بدلاً من{" "}
                <CurrencyLabel
                  amount={program.price}
                  className="line-through"
                  size="xs"
                  tax={50}
                />
              </span>
            </div>
            {/* seperator */}
            <div className="h-px w-11/12 bg-linear-to-r from-transparent via-[#1480D9] to-transparent mx-auto" />
            {/* summary */}
            <div className="flex flex-col gap-3">
              {[
                { icon: Video, label: program.sessions + " جلسات" },
                { label: program.duration + " دقيقة", icon: Clock },
                { label: findCategory(program.category)?.category, icon: Goal },
              ].map((i, index) => (
                <div key={index} className="inline-flex items-center gap-1.5">
                  <i.icon className="w-4 text-theme" />
                  <span className="text-xs font-medium">{i.label}</span>
                </div>
              ))}
            </div>
            {/* consultant */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                مستشارون يقدمون البرنامج{" "}
              </h4>
              <ScrollArea className="h-40 px-3" dir="rtl">
                <div className="flex flex-col gap-3">
                  {program.consultants.map((i, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-white px-3 py-2 rounded"
                    >
                      <div className="relative">
                        {/* image */}
                        <ConsultantImage
                          image={i.image}
                          name={i.name}
                          gender={i.gender}
                          size="sm"
                        />
                        {/* stars */}
                        {i.rate && i.rate > 0 ? (
                          <StarBadge
                            rate={i.rate}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2"
                            size="xs"
                            variant="white"
                          />
                        ) : (
                          ""
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-xs text-gray-700 font-medium">
                          {i.name}
                        </h4>
                        <h4 className="text-[0.6rem] text-gray-600">
                          {findCategory(i.category)?.label}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            {/* seperator */}
            <div className="h-px w-11/12 bg-linear-to-r from-transparent via-[#1480D9] to-transparent mx-auto" />
            {/* reserve */}
            <LinkButton variant="primary" className="flex w-full max-w-80 mx-auto" href={`/programs/reserve/${program.prid}`}>
              <IconLabel Icon={MoveLeft} label="اشترك الآن" size="sm" />
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramContent;
