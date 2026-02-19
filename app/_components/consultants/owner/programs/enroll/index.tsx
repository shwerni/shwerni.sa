"use client";

import React, { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZToast } from "@/app/_components/layout/toasts";
import { cn } from "@/lib/utils";
import { EnrollOnProgram, toggleProgramState } from "@/data/program";
import { ProgramEnrollState } from "@/lib/generated/prisma/enums";

interface ProgramEnrollProps {
  programConsultant: {
    status: ProgramEnrollState | undefined;
    active: boolean;
  } | null;
  programId: number;
  consultantId: number;
}

export default function ProgramEnroll({
  programConsultant,
  programId,
  consultantId,
}: ProgramEnrollProps) {
  const [isPending, startTransition] = useTransition();

  const handleApply = () => {
    startTransition(async () => {
      try {
        const res = await EnrollOnProgram(programId, consultantId);

        if (res) {
          ZToast({ state: true, message: "تم التقديم بنجاح" });
          location.reload();
        } else {
          ZToast({ state: false, message: "فشل في التقديم" });
        }
      } catch {
        ZToast({ state: false, message: "حدث خطأ أثناء الاتصال بالخادم" });
      }
    });
  };

  const handleToggle = () => {
    if (!programConsultant) return;
    const newState = !programConsultant.active;

    startTransition(async () => {
      try {
        const res = await toggleProgramState(programId, consultantId, newState);

        if (res) {
          ZToast({
            state: true,
            message: newState ? "تم التفعيل" : "تم التعطيل",
          });
          location.reload();
        } else {
          ZToast({ state: false, message: "فشل في تغيير التفعيل" });
        }
      } catch {
        ZToast({
          state: false,
          message: "حدث خطأ أثناء الاتصال بالخادم",
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 py-5 space-y-5">
      {/* Badge */}
      {programConsultant?.status && (
        <Badge
          className={cn(
            "px-4 py-2 text-white text-sm font-semibold rounded",
            programConsultant.status === ProgramEnrollState.PENDING && "bg-yellow-500",
            programConsultant.status === ProgramEnrollState.APPROVED && "bg-green-600",
            programConsultant.status === ProgramEnrollState.REJECTED && "bg-red-600"
          )}
        >
          {programConsultant.status === ProgramEnrollState.PENDING && "قيد المراجعة"}
          {programConsultant.status === ProgramEnrollState.APPROVED && "تم القبول"}
          {programConsultant.status === ProgramEnrollState.REJECTED && "مرفوض"}
        </Badge>
      )}

      {/* Apply Button or Toggle */}
      {!programConsultant?.status ? (
        <Button
          onClick={handleApply}
          disabled={isPending}
          className="w-32 bg-zblue-200"
        >
          {isPending ? "جاري التقديم..." : "تقديم"}
        </Button>
      ) : (
        <Button
          onClick={handleToggle}
          disabled={isPending}
          variant={programConsultant.active ? "destructive" : "default"}
          className="w-32"
        >
          {isPending
            ? "جاري التحديث..."
            : programConsultant.active
            ? "تعطيل"
            : "تفعيل"}
        </Button>
      )}
    </div>
  );
}
