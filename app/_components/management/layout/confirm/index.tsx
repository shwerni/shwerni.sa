/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
// React & Next
import React from "react";

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
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";

// icons
import { Check, X } from "lucide-react";

// props
interface Props {
  children?: React.JSX.Element;
  item?: string;
  description?: string;
  lang?: "en" | "ar";
  onConfirm: () => Promise<any>;
  onSuccess?: () => void;
  onFailure?: () => void;
}

export function ConfrimBtnAdmin({
  children,
  description,
  lang,
  onConfirm,
  onSuccess,
  onFailure,
}: Props) {
  // check lang
  const isEn = !lang || lang === "en";
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
          if (onSuccess) onSuccess();
          return;
        }
        // on failure
        if (onFailure) onFailure();
        return;
      } catch {
        // on failure
        if (onFailure) onFailure();
        return;
      }
    });
    // close dialog
    setOpen(false);
  }
  // return
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button className="zgreyBtn">{isEn ? "confirm" : "تأكيد"}</Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="w-11/12 max-w-[425px] rounded-md"
        dir={isEn ? "ltr" : "rtl"}
      >
        <DialogHeader className="flex flex-col items-start">
          <DialogTitle className="text-zblack-200">
            {isEn ? "confirmation" : "تأكيد"}
          </DialogTitle>
          <DialogDescription>
            {isEn ? "you want to proceed ?" : "هل تريد المتابعة ؟"}{" "}
            {description ?? ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2">
          {/* close dialog */}
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              <div className="flex items-center gap-2">
                <X className="w-4" />
                {isEn ? "no" : "لا"}
              </div>
            </Button>
          </DialogClose>
          {/* send action */}
          <Button variant="default" onClick={onSubmit}>
            <LoadingBtnEn loading={onSending}>
              <div className="flex items-center gap-2">
                <Check className="w-4" />
                {isEn ? "yes" : "نعم"}
              </div>
            </LoadingBtnEn>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
