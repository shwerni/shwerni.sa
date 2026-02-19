// React
import Image from "next/image";

// components
import ReservationForm from "./form";
import Stars from "../../shared/stars";
import Error404 from "@/components/shared/error-404";
import CurrencyLabel from "../../shared/currency-label";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CategoryBadge } from "@/components/shared/categories-badge";

// data
import { getProgram } from "@/data/program";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// utils
import { findCategory } from "@/utils";

// icons
import { Clock, Video } from "lucide-react";

// props
interface Props {
  prid: number;
}

const ProgramReserve = async ({ prid }: Props) => {
  // get consultant info
  const program = await getProgram(prid);

  // validate
  if (!program) return <Error404 />;

  // get finance
  const finance = await getFinanceConfig();

  return (
    <div className="space-y-5">
      {/* program info */}
      <div className="grid grid-cols-1 md:grid-cols-2 space-y-5">
        {/* image */}
        <div className="relative">
          <AspectRatio ratio={16 / 7}>
            <Image
              src={program.image}
              alt={program.title || "برنامج استشاري"}
              fill
              className="object-cover rounded-sm"
            />
          </AspectRatio>

          {/* category overlay */}
          <h5 className="absolute bottom-2 right-2 text-white text-sm font-medium z-10">
            برنامج {findCategory(program.category)?.category}
          </h5>
        </div>

        {/* Details */}
        <div className="px-4 space-y-4">
          {/* title & info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-[#1F2A37]">
              {program.title}
            </h3>
            {/* rate and category */}
            <div className="flex items-center gap-1">
              <Stars rate={5} color="#DBA102" />
              <span className="text-xs text-gray-700">{(5).toFixed(1)}</span>
              <CategoryBadge
                category={program.category}
                size="sm"
                label="category"
              />
            </div>
            {/* about */}
            <p>{program.description.split(".").slice(0, 1)}</p>
            {/* info */}
            <div className="flex justify-between items-center w-full bg-[#F1F8FE] px-6 py-2 mx-auto rounded-sm">
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
        </div>
      </div>
      {/* reserve */}
      <ReservationForm
        finance={finance}
        prid={program.prid}
        cost={program.price}
        sessions={program.sessions}
        duration={program.duration}
        consultants={program.consultants}
      />
    </div>
  );
};

export default ProgramReserve;
