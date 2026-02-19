// React & Next
import React from "react";

// components
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import { Button } from "@/components/ui/button";
import LoadingBtn from "@/app/_components/layout/loadingBtn";
import CurrencyLabel from "@/app/_components/layout/currency/label";

// utils
import { totalAfterTax } from "@/utils";

// Props
interface Props {
  children: React.JSX.Element;
  title: string;
  owner?: string;
  total?: number;
  tax?: number | undefined;
  label?: string | null;
  time?: string | null;
  lock: boolean;
  onConfirm: () => Promise<boolean | null>;
  onSuccess?: () => void;
}

export default function ReservationConfirm({
  children,
  owner,
  total,
  tax,
  title,
  label,
  time,
  lock,
  onConfirm,
  onSuccess,
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
  function handleOpen() {
    // open dialog if data valid & not onSending
    if (time && !onSending && lock) setOpen(!open);
  }

  return (
    <>
      {/* reserve confirmation*/}
      <Dialog open={open} onOpenChange={handleOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
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
              حجز برنامج {title} مع المستشار{" "}
              <span className="font-bold">{owner}</span>{" "}
            </li>
            {label && (
              <li className="text-sm text-zgrey-100 text-right whitespace-pre-line leading-5">
                {label}
              </li>
            )}
            {total && tax ? (
              <li className="text-sm text-zgrey-100 text-right whitespace-pre-line leading-5">
                تكلفة الحجز شامل الضريبة
                <CurrencyLabel
                  variant="sm"
                  amount={Number(totalAfterTax(total, tax ?? 15))}
                  textStyle="font-bold text-sm"
                />
              </li>
            ) : (
              ""
            )}
          </ul>
          {/* footer buttons */}
          <DialogFooter className="flex flex-row justify-end gap-2">
            {/* send action */}
            <Button onClick={onSubmit} className="bg-zblue-200 px-7">
              <LoadingBtn loading={onSending}>تأكيد</LoadingBtn>
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
