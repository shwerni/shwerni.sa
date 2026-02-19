// React & Next
import Link from "next/link";
import Image from "next/image";

// components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import UserNav from "@/components/clients/header/user";
import { UserRole } from "@/lib/generated/prisma/enums";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LinkButton } from "@/components/shared/link-button";
import { ThemeToggle } from "@/components/shared/theme-btn";
import { SideBarBtn, SubMenu } from "@/components/clients/header/submenu";

// next auth
import { User } from "next-auth";

// constants
import { subPages, navLinks } from "@/constants/menu";

// icons
import { LogIn, LogOut, Menu } from "lucide-react";

interface Props {
  user?: User;
  path?: string;
}

const HeaderSheet = ({ user, path }: Props) => {
  // is consultant (to simplify there menu)
  const isConsultant = user?.role === UserRole.OWNER;

  return (
    <div className="flex items-center gap-3">
      {/* theme toggle */}
      {/* todo hidden md:flex */}
      <div className="hidden">
        <ThemeToggle variant="switch" />
      </div>

      {/* user */}
      <div className="flex items-center gap-3">
        <Button variant="primary" className="hidden md:flex">
          احجز موعدك الآن
        </Button>

        {/* user nav */}
        {user && <UserNav user={user} />}
      </div>

      {/* side bar */}
      <div className="flex items-center">
        <Sheet>
          {/* trigger */}
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6 text-primary" />
            </Button>
          </SheetTrigger>

          {/* content */}
          <SheetContent
            hidex
            side="left"
            className="h-full bg-white border-border"
          >
            {/* header */}
            <SheetHeader className="flex flex-row items-center gap-3 pb-4 border-b border-border">
              <Image
                src="/layout/metaTilte.png"
                alt="logo"
                width={28}
                height={28}
              />
              <div>
                <SheetTitle className="text-xl font-bold text-primary">
                  شاورني
                </SheetTitle>
                <SheetDescription />
              </div>
            </SheetHeader>

            {/* header & content */}
            <div className="flex flex-col justify-between h-[95%]">
              {/* pages */}
              <ScrollArea className="h-[75vh]" dir="rtl">
                <div className="flex flex-col gap-6 my-6 px-2">
                  {/* pages */}
                  {!isConsultant && (
                    <>
                      {/* main pages */}
                      <div className="space-y-4 bg-gray-200 rounded-lg p-4 shadow">
                        <Label className="text-base font-semibold">
                          القائمة الرئيسية
                        </Label>
                        {/* separator */}
                        <Separator className="bg-white w-10/12 mx-auto" />
                        {/* menu */}
                        <div className="space-y-3">
                          {navLinks.map((i, index) => (
                            <SideBarBtn
                              key={index}
                              item={i}
                              active={path === i.link}
                            />
                          ))}
                        </div>
                      </div>

                      {/* other pages */}
                      <div className="space-y-4 bg-gray-200 rounded-lg p-4 shadow">
                        <Label className="text-base font-semibold">
                          خدمات إضافية
                        </Label>
                        {/* separator */}
                        <Separator className="bg-white w-10/12 mx-auto" />

                        {/* menu */}
                        <div className="space-y-3">
                          {subPages.map(
                            (i, index) =>
                              i.status && (
                                <SideBarBtn
                                  key={index}
                                  item={i}
                                  active={path === i.link}
                                />
                              ),
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* account */}
                  {user && (
                    <div className="space-y-4 bg-muted/40 rounded-lg p-4">
                      <Label className="text-base font-semibold">
                        الملف الشخصي
                      </Label>
                      <SubMenu user={user} />
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* footer */}
              <SheetFooter className="border-t border-border pt-4">
                {user ? (
                  <Link
                    href="/logout"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md text-destructive hover:bg-destructive/10 transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>تسجيل الخروج</span>
                  </Link>
                ) : (
                  <div className="space-y-3 w-full">
                    <Label className="text-muted-foreground text-sm">
                      سجّل دخولك للاستفادة من كامل المزايا
                    </Label>
                    <LinkButton
                      href="/login"
                      variant="destructive"
                      className="gap-2 w-10/12"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>تسجيل الدخول</span>
                    </LinkButton>
                  </div>
                )}
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default HeaderSheet;
