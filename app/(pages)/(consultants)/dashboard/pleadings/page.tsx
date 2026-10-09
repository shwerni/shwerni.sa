// React & Next
import { notFound } from "next/navigation";

// components
import { PleadingsList } from "@/components/consultant/pleadings/list";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";
import { listConsultantPleadings } from "@/data/pleading";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { Categories } from "@/lib/generated/prisma/enums";

// the consultant's pleading cases (LAW consultants only)
export default async function PleadingsPage() {
  const user = await userServer();
  if (!user?.id) notFound();

  const consultant = await getOwnerbyAuthor(user.id);
  if (!consultant || consultant.category !== Categories.LAW) notFound();

  // expired cases are persisted as EXPIRED by the query itself
  const items = (await listConsultantPleadings(user.id)) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">طلبات المرافعة</h1>
        <p className="text-sm text-gray-500 mt-1">
          ملخصات القضايا من العملاء: رد على العميل وحدد سعر الجلسة، أو اعتذر عن الطلب
        </p>
      </div>
      <PleadingsList items={items} />
    </div>
  );
}
