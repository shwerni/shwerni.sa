import Image from "next/image";

import { Weekday } from "@/lib/generated/prisma/enums";

import { FaCheckCircle } from "react-icons/fa";

// props
interface Props {
  day: Weekday;
  header: string;
  title: string;
  description: string;
}

export const WeekdayAr: Record<keyof typeof Weekday, string> = {
  SUNDAY: "الأحد",
  MONDAY: "الإثنين",
  TUESDAY: "الثلاثاء",
  WEDNESDAY: "الأربعاء",
  THURSDAY: "الخميس",
  FRIDAY: "الجمعة",
  SATURDAY: "السبت",
};

const UnavailableService = ({ header, description, title, day }: Props) => {
  return (
    <div className="flex flex-col items-center gap-y-4 px-2">
      <Image
        src="/other/sorry.png"
        alt="sorry-unavailable"
        width={300}
        height={300}
      />
      <h4 className="text-center text-xl text-gray-600 font-medium">
        نعتذر، ميزة ال{title} غير متوفرة حالياً.
      </h4>
      <p className="text-center text-base text-gray-600 font-medium">
        يمكنك الاستفادة منها يوم {WeekdayAr[day]} الأول من كل شهر.
      </p>
      {/* <p> يمكنك تفعيل التذكير لتصلك إشعار عند توفر الميزة</p> */}
      {/* <Button>تذكيري عند توفر الميزة</Button> */}
    </div>
  );
};

export default UnavailableService;
