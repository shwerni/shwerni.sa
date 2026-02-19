"use server";
// React & Next
import React from "react";
import Link from "next/link";

// components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// utils
import { findUser } from "@/utils";

// lib
import { userServer } from "@/lib/auth/server";

// icons
import { GaugeCircle } from "lucide-react";

export default async function EmployeeHome() {
  // user
  const user = await userServer();

  // if not exist
  if (!user || !user.role) return <WrongPage />;

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
      <div className="cflex gap-3">
        {/* welcome */}
        <p className="text-center">
          We{`'`}re glad to have you on board. Please head to your{" "}
          <strong>dashboard</strong> to view your tasks and updates.
        </p>
        {/* dashboard */}
        <Link href={findUser(user.role)?.url ?? "/"}>
          <Button className="zgreyBtn gap-x-2">
            <GaugeCircle className="w-5" />
            your dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
