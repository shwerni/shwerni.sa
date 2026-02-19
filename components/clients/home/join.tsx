// React & Next
import Image from "next/image";

// components
import { Button } from "@/components/ui/button";
import { IconLabel } from "@/components/shared/icon-label";
import Section from "@/components/clients/shared/section";

// lib
import { userServer } from "@/lib/auth/server";

// icons
import { ArrowLeft } from "lucide-react";

const Join = async () => {
  // user
  const user = await userServer();

  return (
    !user && (
      <Section className="relative overflow-hidden">
        <div className="relative w-fit space-y-8 py-28 mx-auto z-5">
          <h5 className="text-base sm:text-lg text-white text-center">
            مساحتك لتقديم الدعم..ومساحتك للحصول عليه
          </h5>
          <h3 className="text-4xl sm:text-5xl font-medium text-white text-center">
            كن جزءًا من منصة تصنع فارقًا في حياة الآخرين
          </h3>
          <div className="flex items-center justify-center gap-5">
            <Button variant="primary">
              <IconLabel label="إجراء" Icon={ArrowLeft} />
            </Button>
            <Button variant="transparent">احجز موعدك الشخصي</Button>
          </div>
        </div>
        <Image
          src="/layout/join.png"
          alt="join-us"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55 z-2" />
      </Section>
    )
  );
};

export default Join;
