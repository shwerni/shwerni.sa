// React & Next
import Link from "next/link";

// componments
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

// constants
import { navLinks } from "@/constants/menu";

// icon
import { CircleX } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex flex-col justify-center items-center gap-10 sm:gap-20 min-h-screen mx-5 sm:mx-10">
      {/* logo */}
      <Image src="/layout/logo.png" alt="logo" width={150} height={150} />
      {/* error message  */}
      <div className="flex flex-col justify-center items-center gap-5 sm:gap-10">
        {/* error title */}
        <div className="flex flex-col justify-center items-center">
          <h2 className="inline-flex items-center gap-4 text-7xl tracking-tight font-extrabold text-red-500">
            <CircleX className="w-14 h-14 text-red-500" />
            404
          </h2>
          <h3 className="mb-4 text-xl tracking-tight font-bold text-zblack-100 md:text-2xl text-center">
            حدث خطأ ما.
          </h3>
          <h3 className="text-lg">المعذرة، هذه الصفحة غير موجودة.</h3>
        </div>
        {/* return home */}
        <Link href="/">
          <Button variant="primary">العودة للصفحة الرئيسية</Button>
        </Link>
      </div>
      {/* seperator */}
      <Separator className="w-10/12" />
      {/* links and pages */}
      <div className="flex flex-col justify-center items-center sm:grid grid-cols-3 md:grid-cols-4 gap-2 justify-items-center mb-5">
        {/* clients links */}
        <div className="flex flex-col justify-center items-center gap-5 md:col-span-2">
          <h3 className="text-zblue-200">صفحات العملاء</h3>
          <div className="grid grid-cols-1 grid-rows-3 md:grid-rows-1 md:grid-cols-3 gap-5">
            {navLinks.slice(0, 3).map((i, index) => (
              <Link key={index} href={i.link}>
                <Card className="flex justify-center items-center md:flex-col gap-5 py-3 px-5">
                  <CardTitle>{<i.icon />}</CardTitle>
                  <CardDescription>{i.label}</CardDescription>
                </Card>
              </Link>
            ))}
          </div>
        </div>
        {/* seperator */}
        {/* vertical for big screens */}
        <Separator orientation="vertical" className="hidden sm:block" />
        {/* horizontal for big screens */}
        <Separator className="sm:hidden w-10/12 block my-5" />
        {/* consultant links */}
        <div className="flex flex-col justify-center items-center gap-5">
          <h3 className="text-zblue-200">صفحات المستشارين</h3>
          <Link href="/dashboard">
            <Card className="py-3 px-5 text-sm">لوحة تحكم المستشارين</Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
