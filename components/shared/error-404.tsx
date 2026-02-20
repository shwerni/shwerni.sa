// React & Next
import Image from "next/image";

// components
import Logo from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

const Error404 = () => {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="flex flex-col justify-center items-center gap-6">
        <Logo width={175} height={175} />
        <div className="relative w-48 sm:w-84 md:w-92 h-72">
          <Image
            src="/svg/404.svg"
            alt="not-found"
            width={300}
            height={300}
            className="w-full h-auto"
          />
        </div>
        <h3 className="text-[#094577] text-3xl text-center font-medium">
          يبدو أن هناك خطأ...
        </h3>
        <Button variant="primary" size="lg" className="w-full">
          العودة للصفحة الرئيسة
        </Button>
      </div>
    </div>
  );
};

export default Error404;
