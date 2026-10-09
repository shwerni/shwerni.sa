"use client";
// React & Next
import { useState } from "react";

// components
import { Button } from "@/components/ui/button";
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
import { cancelPleading } from "@/actions/pleading";

// utils
import { pleadingErrors } from "@/utils/pleading";

// icons
import { Loader2, XCircle } from "lucide-react";

// the client withdraws their open case (the chat closes)
export function CancelDialog({
  token,
  onDone,
}: {
  token: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);

  const { execute, isPending } = useAction(cancelPleading, {
    errors: pleadingErrors,
    loading: "جاري الإلغاء...",
    success: "تم إلغاء الطلب",
    onSuccess: () => {
      setOpen(false);
      onDone();
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <XCircle className="w-4 h-4" />
          إلغاء الطلب
        </Button>
      </DialogTrigger>

      <DialogContent dir="rtl" className="text-right">
        <DialogHeader className="text-right!">
          <DialogTitle>إلغاء طلب المرافعة</DialogTitle>
          <DialogDescription>
            سيتم إغلاق المحادثة مع المستشار ولن تتمكن من حجز الجلسة بهذا العرض.
            لا يمكن التراجع عن الإلغاء.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-start">
          <Button
            type="button"
            disabled={isPending}
            onClick={() => execute({ token })}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            تأكيد الإلغاء
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
