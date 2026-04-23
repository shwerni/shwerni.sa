// React & Next
import { notFound } from "next/navigation";

// components
import {
  BaseCostsForm,
  PackageForm,
} from "@/components/consultant/packages/packages";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";
import { getConsultantsPackages } from "@/data/packages";

// lib
import { userServer } from "@/lib/auth/server";

// Packages you want to enforce/allow
const STANDARD_PACKAGES = [3, 4, 5, 6, 8, 10];

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
        <BaseCostsForm consultant={consultant} />
      </section>

      {/* Packages Section */}
      <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          باقات الجلسات المتعددة
        </h2>
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
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
