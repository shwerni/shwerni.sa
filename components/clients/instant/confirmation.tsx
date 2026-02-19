// React & Next
import React from "react";

// components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

// Props
interface Props {
  children: React.JSX.Element;
  label: string;
  owner: string;
  cid: number;
  duration: string;
  lock: boolean;
  total: string | number | null;
  onConfirm: () => Promise<boolean | null>;
  onSuccess?: () => void;
  description?: string;
}

export default function ReservationConfirm({
  children,
  owner,
  lock,
  duration,
  onConfirm,
  onSuccess,
  description,
}: Props) {
  // transistion
  const [onSending, startSending] = React.useTransition();

  // open state
  const [open, setOpen] = React.useState(false);

  // on submit
  async function onSubmit() {
    // start transisiton
    startSending(async () => {
      try {
        // on confirm
        const response = await onConfirm();
        // response
        if (response) {
          // on success
          onSuccess?.();
          return;
        }
        // on failure
        setOpen(false);
        return;
      } catch {
        // on failure
        setOpen(false);
        return;
      }
    });
  }

  // handle open
  function handleOpen(state: boolean) {
    // open dialog if data valid & not onSending
    if (!onSending && lock) setOpen(state);
  }

  return (
    <>
      {/* reserve confirmation*/}
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger>{children}</DialogTrigger>
        <DialogContent
          className="w-11/12 max-w-[425px] bg-zblue-100 space-y-2 rounded-md"
          dir="rtl"
        >
          {/* header */}
          <DialogTitle className="text-xl text-zblue-200">
            تأكيد الحجز
            {/* description */}
            <DialogDescription></DialogDescription>
          </DialogTitle>
          {/* order details */}
          <ul className="space-y-3 mx-5 whitespace-pre-line leading-6 list-disc">
            <li className="text-sm text-zgrey-100 text-right whitespace-pre-line leading-5">
              {description ?? (
                <p>
                  حجز استشارة فورية مع مستشار
                  <span className="font-bold">{owner}</span> لمدة {duration}{" "}
                  دقيقة
                </p>
              )}
            </li>
            {/* <li className="text-sm text-zgrey-100 text-right whitespace-pre-line leading-5">
              {label}
            </li>
            <li className="text-sm text-zgrey-100 text-right whitespace-pre-line leading-5">
              تكلفة الحجز شامل الضريبة {totalAfterTax(Number(total), tax ?? 15)}{" "}
              ر.س
            </li> */}
          </ul>
          {/* footer buttons */}
          <DialogFooter className="flex flex-row justify-end gap-2">
            {/* send action */}
            <Button
              onClick={onSubmit}
              className="bg-zblue-200 px-7"
              loading={onSending}
            >
              تأكيد
            </Button>
            {/* close dialog */}
            <DialogClose asChild>
              <Button type="button" variant="outline">
                إلغاء
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
