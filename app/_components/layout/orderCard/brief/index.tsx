// React & Next
import React from "react";

// components
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import { ScrollArea } from "@/components/ui/scroll-area";
import ConsultationBrief from "@/app/_components/layout/orderCard/brief/owner";

// icons
import { CircleAlert } from "lucide-react";

// props
interface Props {
  oid: number;
  name: string;
  consultant: string;
  description: string | null;
  answer: string | null;
  owner: boolean | undefined;
}

// return default
export default function OrderReason({
  oid,
  name,
  consultant,
  description,
  answer,
  owner,
}: Props) {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <div className="flex items-center gap-2 w-full mx-auto my-2">
            <CircleAlert className="w-5 text-zblue-200" />
            {/* order description */}
            <span className="font-medium">نبذة عن سبب الاستشارة</span>
          </div>
        </DialogTrigger>
        <DialogContent className="w-11/12 max-w-96 rounded" dir="rtl">
          {/* order title */}
          <div className="rflex">
            <h3 className="text-zblue-200">طلب رقم #{oid}</h3>
          </div>
          {/* client name */}
          <div className="flex items-center gap-2">
            <div className="cflex w-9 h-9 bg-zgrey-50 rounded-full">
              <h3>{name[0]}</h3>
            </div>
            <h3>{name}</h3>
          </div>
          {/* description */}
          {description ? (
            <div className="w-full">
              <h6 className="text-zblue-200 font-semibold">
                نبذة عن سبب الاستشارة
              </h6>
              <ScrollArea className="max-h-[500px] py-2 px-3" dir="rtl">
                <p>{description}</p>
              </ScrollArea>
            </div>
          ) : (
            <div className="w-full">
              <h6 className="font-semibold">
                لم يسجل العميل نبذة عن الاستشارة
              </h6>
            </div>
          )}
          {/* consultant name */}
          <div className="flex items-center justify-end gap-2">
            <h3>المستشار {consultant}</h3>
            <div className="cflex w-9 h-9 bg-zgrey-50 rounded-full">
              <h3>{consultant[0]}</h3>
            </div>
          </div>
          {/* consultation answer form */}
          <ConsultationBrief oid={oid} answer={answer} owner={owner} />
        </DialogContent>
      </Dialog>
    </>
  );
}
