// React & Next
import Image from "next/image";

// components
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
  const isConsultant = user?.role === UserRole.OWNER;

  return (
    <div className="flex items-center gap-3">
      <div className="hidden">
        <ThemeToggle variant="switch" />
      </div>

      <div className="flex items-center gap-3">
        <LinkButton
          variant="primary"
          className="hidden md:flex"
          href="/consultants"
        >
          احجز موعدك الآن
        </LinkButton>
        {user && <UserNav user={user} />}
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <button className="relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 hover:bg-[#117ED8]/8 active:scale-95 group">
            <Menu className="w-5 h-5 text-[#117ED8] transition-transform duration-200 group-hover:scale-110" />
          </button>
        </SheetTrigger>

        <SheetContent
          hidex
          side="left"
          className="h-full p-0 border-0 shadow-2xl"
          style={{ width: "300px" }}
        >
          {/* gradient header */}
          <SheetHeader
            className="relative px-6 py-5 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #117ED8 0%, #0a5fa3 100%)",
            }}
          >
            {/* decorative circles */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10"
              style={{ background: "white" }}
            />
            <div
              className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full opacity-10"
              style={{ background: "white" }}
            />

            <div className="relative flex flex-row items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm">
                <Image
                  src="/layout/metaTilte.png"
                  alt="logo"
                  width={24}
                  height={24}
                />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold text-white">
                  شاورني
                </SheetTitle>
                <SheetDescription className="text-white/60 text-xs mt-0">
                  منصة الاستشارات النفسية
                </SheetDescription>
              </div>
            </div>

            {/* user badge if logged in */}
            {user && (
              <div className="relative mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  {user.name?.charAt(0) ?? "U"}
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-none">
                    {user.name}
                  </p>
                  <p className="text-white/60 text-xs mt-0.5">{user.email}</p>
                </div>
              </div>
            )}
          </SheetHeader>

          {/* body */}
          <div
            className="flex flex-col justify-between h-[calc(100%-1px)]"
            style={{
              height: user ? "calc(100% - 170px)" : "calc(100% - 110px)",
            }}
          >
            <ScrollArea className="flex-1" dir="rtl">
              <div className="flex flex-col gap-4 p-4">
                {!isConsultant && (
                  <>
                    {/* main nav */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
                        القائمة الرئيسية
                      </p>
                      <div className="space-y-1">
                        {navLinks.map((i, index) => (
                          <SideBarBtn
                            key={index}
                            item={i}
                            active={path === i.link}
                          />
                        ))}
                      </div>
                    </div>

                    {/* divider */}
                    <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />

                    {/* sub pages */}
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
                        خدمات إضافية
                      </p>
                      <div className="space-y-1">
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

                {/* profile */}
                {user && (
                  <>
                    <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">
                        الملف الشخصي
                      </p>
                      <SubMenu user={user} />
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            {/* footer */}
            <div className="p-4 border-t border-gray-100">
              {user ? (
                <LinkButton
                  href="/logout"
                  variant="destructive"
                  className="flex gap-2 w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>تسجيل الخروج</span>
                </LinkButton>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-center text-gray-400">
                    سجّل دخولك للاستفادة من كامل المزايا
                  </p>
                  <LinkButton
                    href="/login"
                    variant="primary"
                    className="flex gap-2 w-full"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>تسجيل الدخول</span>
                  </LinkButton>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default HeaderSheet;
