// React & Next
import React from "react";
import Image from "next/image";

// components
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import Atitle from "@/app/_components/layout/titles";
import { Section } from "@/app/_components/layout/section";

// icons
import { BadgeCheck } from "lucide-react";

export default function Certificates() {
  return (
    <Section>
      {/* title */}
      <Atitle title="الشهادات و التوثيق" />
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <BadgeCheck className="w-7 text-green-500" />
          <h3>
            شاورني منصة موثقة من الجهات المعتمدة بالمملكة العربية السعودية
          </h3>
        </div>
        {/* certificate */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="w-11/12  max-w-80">
              {/* image */}
              <Image
                src="/layout/certificate.jpg"
                alt="certificate"
                width={1000}
                height={1000}
              />
            </div>
          </DialogTrigger>
          <DialogContent className="w-10/12 max-w-[700px] p-0">
            <div className="cflex w-full">
              {/* image */}
              <Image
                src="/layout/certificate.jpg"
                alt="certificate"
                width={1000}
                height={1000}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Section>
  );
}
