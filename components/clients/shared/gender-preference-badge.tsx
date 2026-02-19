// React & Next
import React from "react";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/enums";

// icons
import { CircleSmall, Mars, Venus } from "lucide-react";

// Mapping enum to label, color, and icon
const genderBadgeMap: Record<
  GenderPreference,
  { label: string; bgColor: string; textColor: string; icon: React.JSX.Element }
> = {
  [GenderPreference.MEN_ONLY]: {
    label: "للرجال فقط",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    icon: <Mars className="w-5 inline mr-1" />,
  },
  [GenderPreference.WOMEN_ONLY]: {
    label: "للنساء فقط",
    bgColor: "bg-pink-100",
    textColor: "text-pink-800",
    icon: <Venus className="w-5 inline mr-1" />,
  },
  [GenderPreference.BOTH]: {
    label: "للجميع",
    bgColor: "bg-gray-200",
    textColor: "text-gray-800",
    icon: <CircleSmall className="w-5 inline mr-1" />,
  },
};

type BadgeProps = {
  preference: GenderPreference;
};

export const GenderBadge = ({ preference }: BadgeProps) => {
  const { label, bgColor, textColor, icon } = genderBadgeMap[preference];

  return (
    <span
      className={`inline-flex items-center text-xs px-3 py-1 rounded-full font-bold ${bgColor} ${textColor}`}
    >
      {icon}
      {label}
    </span>
  );
};
