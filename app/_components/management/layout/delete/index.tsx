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
} from "@/components/ui/dialog";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";

// icons
import { Trash2 } from "lucide-react";

// props
interface Props {
  children?: React.JSX.Element;
  item?: string;
  description?: string;
  onConfirm: () => Promise<any>;
  onSuccess?: () => void;
  onFailure?: () => void;
}

export function DeleteBtnAdmin({
  children,
  item,
  description,
  onConfirm,
  onSuccess,
  onFailure,
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
        {children ?? <Button variant="destructive">delete</Button>}
      </DialogTrigger>
      <DialogContent className="w-11/12 max-w-[425px] rounded-md">
        <DialogHeader className="flex flex-col items-start">
          <DialogTitle className="text-zblack-200">
            delete this {item ?? "item"}
          </DialogTitle>
          <DialogDescription>
            are you sure to delete this {item ?? "item"} ?{description ?? ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row justify-end gap-2">
          {/* close dialog */}
          <DialogClose asChild>
            <Button type="button" variant="outline">
              cancel
            </Button>
          </DialogClose>
          {/* send action */}
          <Button variant="destructive" onClick={onSubmit}>
            <LoadingBtnEn loading={onSending}>
              <div className="flex items-center gap-2">
                delete
                <Trash2 className="w-4" />
              </div>
            </LoadingBtnEn>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
