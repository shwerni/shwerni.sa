"use client";
// React & Next
import React from "react";
import Link from "next/link";

// component
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import CopyBtn from "@/components/legacy/layout/copyBtn";
import { ZToast } from "@/components/legacy/layout/toasts";
import Confirm from "@/components/legacy/layout/navigation/confirm";

// lib
import { cn } from "@/lib/utils";

// prisma types
import { ApprovalState, ConsultantState } from "@/lib/generated/prisma/enums";

// handlers
import { ownerVisibility } from "@/handlers/conusltant/owner/profile";

// contants
import { mainRoute } from "@/constants/links";

// icons
import {
  CheckCircle2,
  CircleAlert,
  Clock,
  ExternalLink,
  EyeOff,
  PauseCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// props
interface Props {
  cid: number;
  state: boolean;
  author: string | undefined;
  stateA: ConsultantState;
  approved: ApprovalState;
  adminNote: string | null;
}

// what the consultant actually sees, in their terms
type ListingStatus =
  | "live"
  | "review"
  | "rejected"
  | "hiddenByAdmin"
  | "paused";

// status → label, explanation, look
const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; description: string; icon: LucideIcon; tone: string }
> = {
  live: {
    label: "منشور",
    description: "إعلانك ظاهر للعملاء ويمكنهم الحجز معك",
    icon: CheckCircle2,
    tone: "bg-green-50 text-green-700 border-green-200",
  },
  review: {
    label: "قيد المراجعة",
    description: "يراجع فريقنا إعلانك، وسيظهر للعملاء فور اعتماده",
    icon: Clock,
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  },
  rejected: {
    label: "مرفوض",
    description: "راجع ملاحظة الإدارة، ثم عدّل بياناتك واحفظها لإعادة المراجعة",
    icon: XCircle,
    tone: "bg-red-50 text-red-700 border-red-200",
  },
  hiddenByAdmin: {
    label: "مخفي من الإدارة",
    description: "أخفت الإدارة إعلانك، تواصل مع الدعم لمعرفة السبب",
    icon: EyeOff,
    tone: "bg-red-50 text-red-700 border-red-200",
  },
  paused: {
    label: "متوقف",
    description: "أوقفت ظهور إعلانك، فعّله ليعود للظهور للعملاء",
    icon: PauseCircle,
    tone: "bg-zgrey-50 text-muted-foreground border-zgrey-50",
  },
};

// same precedence as before, but based on the live switch value
function getListingStatus(
  active: boolean,
  stateA: ConsultantState,
  approved: ApprovalState,
): ListingStatus {
  if (!active) return "paused";
  if (approved === ApprovalState.REJECTED) return "rejected";
  if (stateA === ConsultantState.HIDDEN) return "hiddenByAdmin";
  if (approved === ApprovalState.PENDING || stateA === ConsultantState.HOLD)
    return "review";
  return "live";
}

// toggle visibility of consultant advertisement
export default function Togglevisibility({
  cid,
  author,
  state,
  stateA,
  approved,
  adminNote,
}: Props) {
  // advertisement state
  const [active, setActive] = React.useState<boolean>(state);
  // loading submit
  const [isSending, startSending] = React.useTransition();

  // resync when the server value changes (e.g. after saving the profile)
  const [prevState, setPrevState] = React.useState(state);
  if (state !== prevState) {
    setPrevState(state);
    setActive(state);
  }

  // derived status
  const status = getListingStatus(active, stateA, approved);
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;

  // consultant public link
  const link = `${mainRoute}consultants/${cid}`;

  // handle toggle (optimistic, reverts on failure)
  function handleToggle(next: boolean) {
    setActive(next);
    startSending(() => {
      if (!author) {
        setActive(!next);
        return;
      }
      ownerVisibility(author, next).then((response) => {
        if (!response.state) setActive(!next);
        ZToast(response);
      });
    });
  }

  // switch (pausing asks for confirmation, activating is instant)
  const visibilitySwitch = (
    <Switch
      id="listing-visibility"
      dir="ltr"
      checked={active}
      disabled={isSending}
      onCheckedChange={active ? undefined : () => handleToggle(true)}
    />
  );

  return (
    <div
      dir="rtl"
      className="rounded-xl border border-zgrey-50 p-4 sm:p-5 space-y-4"
    >
      {/* status + visibility control */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h5 className="text-sm">حالة الإعلان</h5>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                config.tone,
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {config.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            {config.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Label htmlFor="listing-visibility" className="text-sm font-normal">
            {active ? "ظاهر للعملاء" : "غير ظاهر"}
          </Label>
          {active ? (
            <Confirm
              title="إيقاف ظهور الإعلان؟"
              description="لن يظهر إعلانك للعملاء ولن يتمكنوا من الحجز معك حتى تعيد تفعيله."
              action={() => handleToggle(false)}
            >
              {visibilitySwitch}
            </Confirm>
          ) : (
            visibilitySwitch
          )}
        </div>
      </div>

      {/* admin note */}
      {adminNote && (
        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <CircleAlert className="w-5 h-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-700">
              ملاحظة الإدارة
            </p>
            <p className="text-sm leading-7">{adminNote}</p>
          </div>
        </div>
      )}

      {/* public link (only when clients can actually see it) */}
      {status === "live" && (
        <div className="flex flex-col gap-2 border-t border-zgrey-50 pt-4 sm:flex-row sm:items-center">
          <span
            dir="ltr"
            className="min-w-0 flex-1 truncate rounded-md bg-zgrey-50 px-3 py-2 text-xs text-muted-foreground"
          >
            {link}
          </span>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="bg-zblue-200 gap-1">
              <Link href={link} target="_blank" rel="noopener noreferrer">
                زيارة إعلانك
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <CopyBtn label="نسخ الرابط" copy={link} />
          </div>
        </div>
      )}
    </div>
  );
}
