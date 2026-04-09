// React & Next
import Link from "next/link";

// componments
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// icon
import { CircleX } from "lucide-react";

// constants
import { mainLinks } from "@/constants/menu";

export default function WrongPage() {
  return (
    <div className="cflex gap-10 sm:gap-20 min-h-screen" dir="rtl">
      {/* error message  */}
      <div className="cflex gap-5 sm:gap-10">
        {/* error title */}
        <div className="cflex">
          <h2 className="rflex gap-4 text-7xl tracking-tight font-extrabold text-red-500">
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
          <Button className="bg-zblue-200">العودة للصفحة الرئيسية</Button>
        </Link>
      </div>
      {/* seperator */}
      <Separator className="w-10/12" />
      {/* links and pages */}
      <div className="cflex sm:grid grid-cols-3 mdlg:grid-cols-4 gap-2 justify-items-center mb-5">
        {/* clients links */}
        <div className="mdlg:col-span-2 cflex gap-5">
          <h3 className="text-zblue-200">صفحات العملاء</h3>
          <div className="grid grid-cols-1 grid-rows-3 mdlg:grid-rows-1 mdlg:grid-cols-3 gap-5">
            {mainLinks.map((i, index) => (
              <Link key={index} href={i.link}>
                <Card className="rflex mdlg:flex-col gap-5 py-3 px-5">
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
        <div className="cflex gap-5">
          <h3 className="text-zblue-200">صفحات المستشارين</h3>
          <Link href="/dashboard">
            <Card className="py-3 px-5 text-sm">لوحة تحكم المستشارين</Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
