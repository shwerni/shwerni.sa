// React & Image
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";

const FreeSessionsHeader = () => {
  return (
    <div className="space-y-5">
      <div className="px-5">
        <AspectRatio
          ratio={16 / 6}
          className="relative overflow-hidden rounded-lg"
        >
          {/* Background Image */}
          <Image
            src="https://huqzhdqiy3.ufs.sh/f/8ARlb1WnaI71hRTVMKbDXmCLjFtreTvn0Vsqhd5KUibfcAYH"
            alt="Photo"
            fill
            className="object-cover"
            priority
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0" />

          {/* Text Content */}
          {/* <div className="absolute bottom-0 inset-x-0 flex items-center justify-center">
          <h2 className="text-[#6b4e45] text-xl md:text-3xl font-bold text-center px-4">
          يوم بدينا – عز وفخر
          </h2>
          </div> */}
        </AspectRatio>
      </div>
      <p className="w-10/12 max-w-xl mx-auto text-center text-base font-bold text-[#6b4e45]">
        يوم بدينا – عز وفخر 🇸🇦 عرض يوم التأسيس في شاورني احتفالًا بـ يوم
        التأسيس، يسعدنا في شاورني أن نقدم لك جلسة استشارية مجانية لمدة 30 دقيقة
      </p>
    </div>
  );
};

export default FreeSessionsHeader;
