"use client";
// React & Next
import React from "react";

// components
import {
    Dialog, DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
    DialogClose,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import { Button } from "@/components/ui/button";
import LoadingBtn from "@/app/_components/layout/loadingBtn";
import { cn } from "@/lib/utils";

// props
type Props = {
    title: string;
    description?: string;
    action: () => Promise<void> | void;
    children: React.ReactNode;
    dir?: "rtl" | "ltr";
    cancelLabel?: string;
    className?: string;
};

export default function Confirm({
    title,
    description,
    action,
    children,
    dir = "rtl",
    cancelLabel,
    className
}: Props) {
    // state
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    // handle actions
    const handleAction = async () => {
        // load state
        setLoading(true);
        try {
            // action
            await action();
        } finally {
            // close
            setOpen(false);
            // load state
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <span onClick={() => setOpen(true)}>{children}</span>

            <DialogContent dir={dir ?? "rtl"} className={cn(["max-w-md rounded-md ", className ?? ""])}>
                <DialogHeader className="flex flex-col items-start">
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    {description && (
                        <DialogDescription className="text-zgrey-100">
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <DialogFooter className="flex flex-row justify-end gap-3">
                    <DialogClose>
                        <Button className="zgreyBtn">{cancelLabel ?? "إلغاء"}</Button>
                    </DialogClose>
                    <Button onClick={handleAction} disabled={loading}>
                        <LoadingBtn loading={loading}>تأكيد</LoadingBtn>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
