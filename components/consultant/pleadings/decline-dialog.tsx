"use client";
// React & Next
import { useState } from "react";

// components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { declinePleading } from "@/actions/pleading";

// utils
import { pleadingErrors } from "@/utils/pleading";

// icons
import { Loader2, XCircle } from "lucide-react";

// the consultant declines the case, with an optional reason; the client is always notified
export function DeclineDialog({
  plid,
  disabled,
  onDone,
}: {
  plid: number;
  disabled?: boolean;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const { execute, isPending } = useAction(declinePleading, {
    errors: pleadingErrors,
    loading: "جاري الإرسال...",
    success: "تم الاعتذار عن الطلب وإبلاغ العميل",
    onSuccess: () => {
      setOpen(false);
      setReason("");
      onDone();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <XCircle className="w-4 h-4" />
          الاعتذار عن الطلب
        </Button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="text-right">
        <DialogHeader className="text-right!">
          <DialogTitle>الاعتذار عن طلب المرافعة رقم {plid}</DialogTitle>
          <DialogDescription>
            سيتم إغلاق المحادثة وإبلاغ العميل بالاعتذار. لا يمكن التراجع عن هذا الإجراء.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label
            htmlFor={`decline-reason-${plid}`}
            className="text-sm font-medium text-slate-700"
          >
            سبب الاعتذار (اختياري)
          </label>
          <Textarea
            id={`decline-reason-${plid}`}
            rows={4}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
            placeholder="يظهر للعميل في المحادثة"
          />
          <p className="text-xs text-slate-400 tabular-nums">
            {reason.length}/500
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => execute({ plid, reason: reason.trim() || null })}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            تأكيد الاعتذار
          </Button>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isPending}>
              تراجع
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
