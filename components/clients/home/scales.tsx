import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";

// components
import DivMotion from "@/components/shared/div-motion";

const ScalesCta = () => {
  return (
    <DivMotion variant="blur-in" delay={0.3}>
      <Link
        href="/scales"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-sm hover:shadow-md hover:border-[#094577]/40 transition-all duration-200"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[#094577]/10 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-[#094577]" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
              اكتشف مقاييسك النفسية والأسرية
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate">
              أجب على أسئلة بسيطة واحصل على نتيجتك فوراً ومجاناً
            </p>
          </div>
        </div>

        <span className="shrink-0 w-8 h-8 rounded-full bg-gray-100 group-hover:bg-[#094577] flex items-center justify-center transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
        </span>
      </Link>
    </DivMotion>
  );
};

export default ScalesCta;
