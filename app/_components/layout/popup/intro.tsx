"use server";
// React and Next
import React from "react";
import Link from "next/link";

// components
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Dialog,
  DialogContent,
} from "@/app/_components/layout/shadcnM/dialogWithoutX";
import { DialogClose } from "../zDialog";
import { Button } from "@/components/ui/button";

// icons
import { Check, X } from "lucide-react";

// return default
export default async function IntroPopUp() {
  // temporary content (the popup content)
  function PopUpContent() {
    return (
      <div className="space-y-3">
        <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="flex justify-center">
          <div className="bg-zblue-200/10 text-zblue-200 p-4 rounded-full shadow-sm border border-zblue-200/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        {/* Decorative badge */}
        <div className="flex justify-center">
          <div className="bg-zblue-100/20 backdrop-blur-sm border border-zblue-200/50 text-zblue-200 px-4 py-1 rounded-full text-sm font-semibold shadow-sm">
            الجمعة البيضاء
          </div>
        </div>

        {/* Main content */}
        <div className="text-center px-4 space-y-2">
          <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">
            خصم لا يُفوّت 🔥
          </h2>

          <p className="text-lg font-medium text-gray-700">
            استشر مختصًّا ✨ الآن بـ{" "}
            <span className="text-zblue-200 font-bold text-xl">89 ريال</span>{" "}
            فقط
          </p>
        </div>

        {/* Divider */}
        <div className="w-16 my-10 mx-auto h-[2px] bg-zblue-200/40 rounded-full"></div>
        <div className="rflex my-5">
          <div className="flex items-center gap-2">
            <Check className="text-zblue-200" />
            مستشارك ينتظرك
          </div>
        </div>
        {/* CTA Button */}
        <Link href="/event">
          <Button className="w-full bg-zblue-200 hover:bg-zblue-300 text-white text-lg py-6 rounded-xl shadow-md transition-all">
            احجز الآن
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Dialog defaultOpen={true}>
      <DialogContent
        className="w-10/12 max-w-[400px] min-h-44 rounded-md p-2.5"
        dir="rtl"
      >
        <DialogHeader className="hidden">
          <DialogTitle>Intro Popup</DialogTitle>
          <DialogDescription>Intro decription</DialogDescription>
        </DialogHeader>
        <PopUpContent />
      </DialogContent>
    </Dialog>
  );
}

// <div>
//         <div className="w-72 sm:w-96 py-4 mx-auto">
//           <Image
//             src="/other/event.png"
//             alt="pic"
//             width={500}
//             height={500}
//             className="rounded"
//           />
//         </div>
//         <Link href="/event">
//           <Button className="w-full bg-zblue-200">إحجز الآن</Button>
//         </Link>
//       </div>

{
  /* <>
  <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogClose>
  <div className="w-72 sm:w-96 py-4">
    <Image src="/other/temp1.jpeg" alt="pic" width={500} height={500} />
  </div>
</> */
}

{
  /* <>
        <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogClose>
          <MotionGraphicPlayer />
        </DialogClose>
      </> */
}

{
  /* <>
  <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogClose>
  <DialogHeader className="items-start">
    <DialogTitle>كوبون خصم</DialogTitle>
    <DialogDescription>
      لا تفوتوا عرضنا الرائع. لفترة محدودة فقط!
    </DialogDescription>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    <p className="text-center text-lg font-bold">خصم 10% لأول حجز </p>
    <p className="text-center">
      استخدم الكوبون <span className="font-semibold">SAVE10</span> عند الدفع.
    </p>
  </div>
  <DialogFooter className="w-full">
    <div className="flex justify-center gap-5 sm:gap-10 max-w-80 mx-auto">
      <CopyBtn
        copy="SAVE10"
        label="نسخ الكوبون"
        className="w-32 !bg-zblue-200 !text-white"
      ></CopyBtn>
      <DialogClose asChild>
        <Button className="zgreyBtn w-32">غلق</Button>
      </DialogClose>
    </div>
  </DialogFooter>
</> */
}

{
  /* <>
  <DialogClose className="absolute left-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
    <X className="h-4 w-4" />
    <span className="sr-only">Close</span>
  </DialogClose>
  <DialogHeader className="items-start">
    <DialogTitle>كوبون خصم</DialogTitle>
    <DialogDescription>
      لا تفوتوا عرضنا الرائع. لفترة محدودة فقط!
    </DialogDescription>
  </DialogHeader>
  <div className="grid gap-4 py-4">
    <p className="text-center text-lg font-bold">خصم 10% لأول حجز </p>
    <p className="text-center">
      استخدم الكوبون <span className="font-semibold">SAVE10</span> عند الدفع.
    </p>
  </div>
  <DialogFooter className="w-full">
    <div className="flex justify-center gap-5 sm:gap-10 max-w-80 mx-auto">
      <CopyBtn
        copy="SAVE10"
        label="نسخ الكوبون"
        className="w-32 !bg-zblue-200 !text-white"
      ></CopyBtn>
      <DialogClose asChild>
        <Button className="zgreyBtn w-32">غلق</Button>
      </DialogClose>
    </div>
  </DialogFooter>
</> */
}
