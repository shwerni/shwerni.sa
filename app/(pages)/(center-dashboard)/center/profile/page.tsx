// components
import UploadThingWrapper from "@/components/wrappers/uploadthing";
import { PageHeader } from "@/components/center-dashboard/ui";
import { ProfileForm } from "@/components/center-dashboard/profile-form";

// prisma data
import { getCenterSettings } from "@/data/center/dashboard";
import { requireCenter } from "@/data/center/require-center";

// prisma types
import { CenterState } from "@/lib/generated/prisma/enums";

// constants
import { mainRoute } from "@/constants/links";

const STATUS_LABEL: Record<CenterState, string> = {
  [CenterState.PUBLISHED]: "منشور",
  [CenterState.HOLD]: "معلّق",
  [CenterState.HIDDEN]: "مخفي",
};

// the center's own profile. slug and status are shown read-only (admin-only)
export default async function Page() {
  const ctx = await requireCenter().catch(() => null);
  if (!ctx) return null;

  const center = await getCenterSettings(ctx.centerId);
  if (!center) return null;

  return (
    <UploadThingWrapper>
      <PageHeader title="ملف المركز" description="البيانات التي تظهر في صفحة المركز العامة" />

      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>
          الرابط:{" "}
          <span dir="ltr" className="text-foreground">
            {mainRoute}centers/{center.slug}
          </span>
        </span>
        <span>
          الحالة: <span className="text-foreground">{STATUS_LABEL[center.status]}</span>
        </span>
      </div>

      <ProfileForm center={center} />
    </UploadThingWrapper>
  );
}
