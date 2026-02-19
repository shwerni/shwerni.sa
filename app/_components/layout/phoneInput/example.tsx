// React & Next
import React from "react";

// components
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import { Separator } from "@/components/ui/separator";

// utils
import { cn } from "@/lib/utils";

// constants
import examplesPhone from "@/constants/phone/examplesPhones.json";

// icons
import { CircleAlert, X } from "lucide-react";

// props
interface Props {
  width?: number;
  className?: string;
}
export default function PhonesExample({ className, width }: Props) {
  return (
    <Dialog>
      <DialogTrigger>
        <div
          className={cn([
            "w-fit h-fit bg-transparent px-0.5 py-0.5 hover:bg-transparent",
            className,
          ])}
        >
          <CircleAlert className="text-zblue-200" width={width} />
        </div>
      </DialogTrigger>
      <DialogContent className="w-11/12 max-w-96 rounded-md" dir="rtl">
        <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader className="items-start">
          <DialogTitle>امثلة صحيحة</DialogTitle>
          <DialogDescription>امثلة ارقام هاتف لكل دولة </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:gap-1" dir="ltr">
          {/* table */}
          <div className="grid grid-cols-3 items-center justify-items-center my-1">
            <h6>اسم البلد</h6>
            <h6>كود البلد</h6>
            <h6>مثال</h6>
          </div>
          <Separator className="w-10/12 mx-auto" />
          {examplesPhone.map((i, index) => (
            <React.Fragment key={index}>
              {/* example */}
              <div className="grid grid-cols-3 items-center justify-items-center my-2">
                <h6 className="text-center">{i.country}</h6>
                <h6>{i.code}</h6>
                <h6>{i.formatted}</h6>
              </div>
              {/* separator */}
              <Separator className="w-10/12 mx-auto" />
            </React.Fragment>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
