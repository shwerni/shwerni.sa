// components
import { PageHeader } from "@/components/center-dashboard/ui";
import { ThemeForm } from "@/components/center-dashboard/theme-form";

// prisma data
import { getCenterSettings } from "@/data/center/dashboard";
import { requireCenter } from "@/data/center/require-center";

// the center's theme (centers spec §13)
export default async function Page() {
  const ctx = await requireCenter().catch(() => null);
  if (!ctx) return null;

  const center = await getCenterSettings(ctx.centerId);
  if (!center) return null;

  return (
    <div>
      <PageHeader
        title="المظهر"
        description="ألوان صفحة المركز: الأزرار والشارات والخلفيات الخفيفة"
      />
      <ThemeForm themeKey={center.themeKey} themeVars={center.themeVars} />
    </div>
  );
}
