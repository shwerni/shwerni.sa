// React & Next
import React from "react";

// lib
import {
  Consultant,
  Collaboration,
  GenderPreference,
} from "@/lib/generated/prisma/client";

// types
import { User } from "next-auth";

// components
import Stars from "@/components/clients/shared/stars";
import { IconLabel } from "@/components/shared/icon-label";
import { LinkButton } from "@/components/shared/link-button";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { GenderBadge } from "@/components/clients/shared/gender-preference-badge";

// icons
import {
  Medal,
  StarsIcon,
  Telescope,
  Lightbulb,
  CalendarDays,
} from "lucide-react";
import { CiMedal } from "react-icons/ci";
import { RxSwitch } from "react-icons/rx";
import { RiAppsLine } from "react-icons/ri";
import FavoriteBtn from "@/components/shared/favorite-btn";

// props
interface Props {
  user?: User;
  favorite: boolean;
  collaboration: Collaboration | null;
  // prettier-ignore
  consultant: 
  Consultant 
  & { years: number }
  & { reviews: number } 
  & { specialties: string[] };
}

const ConsultantProfile: React.FC<Props> = ({
  user,
  favorite,
  collaboration,
  consultant,
}: Props) => {
  // consultant summary
  const summary = [
    {
      label: "سنوات الخبرة",
      value: consultant.years,
      icon: Medal,
    },
    {
      label: "المراجعات",
      value: consultant.reviews,
      icon: StarsIcon,
    },
    {
      label: "جاهزية المستشار",
      value: consultant.status ? "متاح" : "غير متاح",
      icon: RxSwitch,
    },
  ];

  return (
    <>
      {/* basic info */}
      <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center gap-2 sm:gap-10 pt-5">
        {/* image */}
        <ConsultantImage
          name={consultant.name}
          image={consultant.image}
          gender={consultant.gender}
          size="lg"
        />
        {/* name & category & rate */}
        <div className="flex flex-col items-center sm:items-start gap-3 sm:gap-1.5">
          {/* name */}
          <h2 className="text-[#094577] font-semibold text-3xl sm:text-4xl">
            {consultant.name}
          </h2>
          {/* category & rate */}
          <div className="flex items-center gap-2 sm:gap-1.5">
            {/* category */}
            <CategoryBadge category={consultant.category} size="xs" />
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
          {/* like & reserve */}
          <div className="flex items-center gap-3">
            {/* reserve */}
            <LinkButton variant="primary" size="sm" href="#reserve">
              <IconLabel Icon={CalendarDays} label="احجز موعدك الآن" />
            </LinkButton>
            {/* like */}
            <FavoriteBtn
              author={user?.id}
              favorite={favorite}
              cid={consultant.cid}
              size={24}
            />
          </div>
          {/* gender preference */}
          {consultant.preference !== GenderPreference.BOTH && (
            <GenderBadge preference={consultant.preference} />
          )}
        </div>
      </div>
      {/* experience & reviews count */}
      <div className="flex flex-wrap justify-between sm:justify-start items-center gap-y-3 gap-x-10 bg-[#F1F8FE] py-3 px-5 rounded-md">
        {summary.map((i) =>
          i.value ? (
            <div key={i.label} className="flex items-center gap-2">
              <i.icon className="w-4 h-4 text-400" />
              <h6 className="text-gray-700 text-sm">{i.label}</h6>
              <h6 className="text-[#094577] text-sm font-bold">{i.value}</h6>
            </div>
          ) : null,
        )}
      </div>
      {/* all info */}
      <div className="space-y-6">
        {/* about */}
        <div className="space-y-2">
          <Title label=" نبذة عن الاستشاري" Icon={Lightbulb} />
          {/* later edit  */}
          <p>{consultant.nabout}</p>
        </div>
        {/* experience & educations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5">
          {/*  educations */}
          {consultant.neducation && (
            <div className="space-y-2">
              <Title label="الشهادات والتعليم" Icon={Telescope} />
              <ul className="list-disc pr-10">
                {consultant.neducation.map((i, index) => (
                  <li key={index} className="text-gray-500">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* experience  */}
          {consultant.nexperiences && (
            <div className="space-y-2">
              <Title label="الخبرات العملية" Icon={CiMedal} />
              <ul className="list-disc pr-10">
                {consultant.nexperiences.map((i, index) => (
                  <li key={index} className="text-gray-500">
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {/* specialties */}
        {consultant.specialties && (
          <div className="space-y-2">
            <Title label="التخصصات المفتاحية" Icon={RiAppsLine} />
            <div className="flex flex-wrap gap-x-3 gap-y-2">
              {consultant.specialties.map((i, index) => (
                <div
                  key={index}
                  className="bg-gray-50 text-gray-800 text-xs border border-gray-100 py-1.5 px-2 rounded-sm"
                >
                  {i}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* packages */}
        {/* <div></div> */}
      </div>
    </>
  );
};

export default ConsultantProfile;

function Title({
  label,
  Icon,
}: {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <Icon className="w-5 h-5 text-theme" />
      <h4 className="text-[#094577] text-base font-semibold">{label}</h4>
    </div>
  );
}
