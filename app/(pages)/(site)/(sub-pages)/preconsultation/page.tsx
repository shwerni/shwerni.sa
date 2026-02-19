// React & Next
import React from "react";
import { Metadata } from "next";

// componenets
import UnavailableService from "@/components/shared/unavailable-service";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الجلسات التوجيهية",
  description:
    "احجز جلسة نفسية اونلاين مع مختصين مرخصين عبر منصة شاورني. خصوصية وأمان تام، ودعم يناسب احتياجاتك النفسية من أي مكان.",
};

// default
export default async function PreConsultationSession() {
  // role
  // const user = await userServer();

  // todo
  return (
    <UnavailableService
      title="جلسة مجانية"
      header="جلسة توجيهية – استشارة مكتوبة من خبرائنا"
      description="فرصة لك للحصول على توجيه شخصي من أحد خبراء شاورني مرة واحدة كل شهر. أرسل استفسارك وسيتلقى المستشار إشعارًا للرد عليك برسالة مكتوبة."
      day={Weekday.MONDAY}
    />
  );
}
