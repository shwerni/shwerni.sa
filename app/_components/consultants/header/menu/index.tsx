"use client";
// React & Next
import Link from "next/link";
import { usePathname } from "next/navigation";

// packages
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

// utils
import { cn } from "@/lib/utils";

// Icons
import { LogOut, Menu } from "lucide-react";

// constants
import { cdashboard } from "@/constants/menu";

//return
export function Zmenu(props: { user: string | null | undefined }) {
  // active nav button
  const path = usePathname();
  return (
    <Sheet>
      {/* nav sidebar */}
      <SheetTrigger asChild>
        {/* nav button */}
        <div className="p-3 text-slate-400">
          <Menu />
        </div>
      </SheetTrigger>
      {/* nav content */}
      <SheetContent
        dir="rtl"
        className="flex flex-col border-none max-w-[250px]! sm:max-w-[350px]!"
      >
        <SheetHeader className="text-right!">
          <SheetTitle>لوحة التحكم</SheetTitle>
        </SheetHeader>
        {/* map dashboard conultant pages */}
        <ScrollArea className="h-screen">
          <div className="flex flex-col gap-4 py-3">
            {cdashboard.map(
              (i, index) =>
                i.status && (
                  <SheetClose key={index} asChild>
                    <Link
                      href={`/dashboard${i.link}`}
                      className={cn([
                        "flex flex-row justify-between items-center gap-2 p-3 rounded-lg",
                        path === `/dashboard${i.link}` ? "dark:bg-slate-600 bg-white" : "",
                      ])}
                    >
                      {<i.icon />}
                      <h3 className="text-base text-left">{i.label}</h3>
                    </Link>
                  </SheetClose>
                )
            )}
            {/* logout */}
            <SheetClose asChild>
              <Link
                href="/auth/signout"
                className="flex flex-row justify-between p-3"
              >
                <LogOut />
                <h3 className="text-base">تسجيل خروج</h3>
              </Link>
            </SheetClose>
          </div>
        </ScrollArea>
        {/* consultant name */}
        {props.user && (
          <h3 className="flex flex-row justify-start gap-3">
            مرحبا, <span>{props.user}</span>
          </h3>
        )}
      </SheetContent>
    </Sheet>
  );
}
