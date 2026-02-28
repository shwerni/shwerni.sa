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
import { Button } from "@/components/ui/button";
import { CalendarRange } from "lucide-react";
import { InstantFormType } from "@/schemas";
import { UseFormReturn } from "react-hook-form";

// props
interface Props {
  consultant: Pick<
    Consultant,
    | "userId"
    | "cid"
    | "name"
    | "rate"
    | "gender"
    | "image"
    | "category"
    | "cost30"
  >;
  onNext: () => void;
  official?: boolean;
  form: UseFormReturn<InstantFormType>;
}

const ConsultantCard = ({ form, consultant, official, onNext }: Props) => {
  return (
    <Card className="w-56 h-40 bg-[#F9FAFB] py-3 border-[#E5E7EB] shadow">
      <CardHeader className="hidden">
        <CardDescription />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between h-full px-4 my-1">
        {/* main info */}
        <div className="flex items-center gap-3">
          {/* image and badge */}
          <div className="relative">
            {/* image */}
            <ConsultantImage
              image={consultant.image}
              name={consultant.name}
              gender={consultant.gender}
              size="base"
            />
            {/* stars */}
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
        </div>
        <Button
          className="gap-1.5 w-11/12 mx-auto"
          variant="primary"
          type="button"
          onClick={() => {
            form.setValue("cid", consultant.cid);
            form.setValue("consultant", consultant.name);
            form.setValue("cost", consultant.cost30);
            onNext();
          }}
        >
          <CalendarRange className="w-5" />
          تأكيد الحجز
        </Button>
      </CardContent>
    </Card>
  );
};

export default ConsultantCard;
