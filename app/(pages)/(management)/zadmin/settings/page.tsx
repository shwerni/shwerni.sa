// React & Next
import React from "react";

// components
import { ZSection } from "@/app/_components/layout/section";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import SettingsAdmin from "@/app/_components/management/admin/settings";

// prisma data
import { getAllSettings } from "@/data/admin/settings/settings";

// return
export default async function Page() {
  // settings
  const settings = await getAllSettings();

  // if not exit
  if (!settings) return <WrongPage />;

  // return
  return (
    <ZSection>
      <div className="w-10/12 max-w-[500px] mx-auto space-y-10">
        {/* title */}
        <h3 className="text-xl">settings</h3>
        {/* settings form */}
        <SettingsAdmin iSettings={settings} />
      </div>
    </ZSection>
  );
}
