// components
import Stars from "@/components/clients/shared/stars";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// prisma data
import { Consultant } from "@/lib/generated/prisma/client";

interface Props {
  consultant: Consultant & { years: number; reviews: number };
}

export default function ConsultantMiniCard({ consultant }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4 flex items-center gap-4">
      <ConsultantImage
        name={consultant.name}
        image={consultant.image}
        gender={consultant.gender}
        size="sm"
        priority
      />
      <div className="flex flex-col gap-1">
        <h2 className="text-[#094577] font-bold text-lg leading-tight">
          {consultant.name}
        </h2>
        <CategoryBadge category={consultant.category} size="xs" />
        {consultant.rate > 0 && consultant.reviews > 0 && (
          <div className="flex items-center gap-2 mt-0.5">
            <Stars rate={consultant.rate} width={70} />
            <span className="text-sm text-gray-700 font-semibold">
              {consultant.rate.toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({consultant.reviews})
            </span>
          </div>
        )}
        {consultant.years > 0 && (
          <p className="text-xs text-gray-500">{consultant.years} سنوات خبرة</p>
        )}
      </div>
    </div>
  );
}
