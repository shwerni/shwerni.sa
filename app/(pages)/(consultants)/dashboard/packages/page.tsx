// React & Next
import { notFound } from "next/navigation";

// components
import {
  BaseCostsForm,
  PackageForm,
  PackagesSwitch,
} from "@/components/consultant/packages/packages";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";
import { basePriceFields, getConsultantsPackages, packageFloors } from "@/data/packages";
import { getPricingSettings } from "@/data/admin/settings/pricing";

// utils
import { effectiveDurations, readCosts } from "@/utils/pricing";

// lib
import { userServer } from "@/lib/auth/server";
import { Clock } from "lucide-react";

// constants
import { PACKAGE_SESSION_COUNTS } from "@/constants/packages";
import { PACKAGE_SESSION_MINUTES } from "@/constants/pricing";

// Packages you want to enforce/allow
const STANDARD_PACKAGES = PACKAGE_SESSION_COUNTS;

export default async function ConsultantPricingDashboard() {
  const user = await userServer();

  // validate
  if (!user?.id) notFound();

  // cid
  const consultant = await getOwnerbyAuthor(user?.id);

  // validate
  if (!consultant) notFound();

  // packages
  const packages = await getConsultantsPackages(consultant.cid);

  // map packages
  const packagesMap = new Map(packages.map((pkg) => [pkg.count, pkg]));

  // the price fields: his own lengths (override, else the default), plus the package session
  // length while he has an active package; minimums from the cached pricing settings
  const settings = await getPricingSettings();
  const durations = effectiveDurations(settings, consultant.durations);
  const fields = basePriceFields(
    durations,
    packages.some((pkg) => pkg.isActive),
  );

  // each package's floor: his 45 price × sessions, less the settings' max package discount
  const floors = packageFloors(
    readCosts(consultant)[String(PACKAGE_SESSION_MINUTES)],
    settings.maxPackageDiscountPercent,
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          إدارة الأسعار والباقات
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          قم بتحديث أسعار الجلسات وتفعيل باقات الجلسات المتعددة
        </p>
      </div>

      {/* Base Costs Section */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          أسعار الجلسات الأساسية
        </h2>
        <BaseCostsForm
          settings={settings}
          fields={fields}
          durations={durations}
          current={readCosts(consultant)}
        />
      </section>

      {/* Packages Section */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="space-y-1 mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            باقات الجلسات المتعددة
          </h2>
          <div className="flex items-center gap-1.5">
            <p className="text-base text-gray-600">جميع جلسات الباقات مدتها</p>
            <span className="text-base text-gray-600 font-semibold">
              45 دقيقة
            </span>
            <Clock className="text-gray-600 w-4" />
          </div>
        </div>
        {/* his "disable all packages" switch */}
        <div className="mb-4">
          <PackagesSwitch initialDisabled={consultant.packagesDisabled} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STANDARD_PACKAGES.map((sessionCount) => {
            const existingPkg = packagesMap.get(sessionCount);
            return (
              <PackageForm
                key={sessionCount}
                consultantId={consultant.cid}
                sessionCount={sessionCount}
                initialCost={existingPkg?.cost || 0}
                initialActive={existingPkg?.isActive || false}
                floor={floors[sessionCount]}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
