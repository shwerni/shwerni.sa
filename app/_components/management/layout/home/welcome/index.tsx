"use server";
// React & Next
import React from "react";

// components
import { Separator } from "@/components/ui/separator";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// utils
import { findUser } from "@/utils";

// lib
import { userServer } from "@/lib/auth/server";

// prisam types
import { UserRole } from "@/lib/generated/prisma/enums";

// icons
import { PiHandWaving } from "react-icons/pi";

export default async function EmployeeWelcome() {
  // user
  const user = await userServer();

  // if not exist
  if (!user || !user.role) return <WrongPage />;

  // is en
  const isEn = user.role === UserRole.ADMIN;

  // role
  const employee = findUser(user?.role);

  // return
  return (
    <div className="w-11/12 max-w-3xl mx-auto space-y-10">
      <div className="space-y-2" dir="rtl">
        <h6 className="text-center font-bold">
          أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ بِسْمِ اللهِ الرَّحْمنِ
          الرَّحِيمِ
        </h6>
        <h3 className="text-center font-bold text-[#FFB000]">
          ﴿فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا * يُرْسِلِ
          السَّمَاءَ عَلَيْكُمْ مِدْرَارًا* وَيُمْدِدْكُمْ بِأَمْوَالٍ وَبَنِينَ
          وَيَجْعَلْ لَكُمْ جَنَّاتٍ وَيَجْعَلْ لَكُمْ أَنْهَارًا﴾
        </h3>
      </div>
      {/* separator */}
      <Separator className="w-11/12 max-w-60 mx-auto" />
      <div className="space-y-3" dir={isEn ? "ltr" : "rtl"}>
        <div className="rflex gap-3">
          <PiHandWaving className="w-10 h-10 text-zblue-200" />
          <h3 className="text-left">
            {isEn ? "Welcome" : "اهلا وسهلا"}{" "}
            <span className="text-zblue-200">{user?.name ?? ""}</span> ,{" "}
            {employee?.greeting}
          </h3>
        </div>
        {/* role */}
        <p className="text-center">{employee?.description}</p>
      </div>
    </div>
  );
}
