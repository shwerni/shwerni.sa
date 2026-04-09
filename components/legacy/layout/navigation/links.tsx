// React & Next
import Link from "next/link";

// componments
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// constants
import { mainLinks } from "@/constants/menu";

// icons
import { TriangleAlert } from "lucide-react";

// props
interface Props {
  message?: string;
}

export default function PagesLinks({ message }: Props) {
  {
    /* not found page content */
  }
  return (
    <div className="cflex gap-10" dir="rtl">
      {message ? (
        <div className="cflex gap-10">
          <Separator className="w-10/12" />
          <div className="rflex gap-2 mx-auto text-center">
            <TriangleAlert className="w-7 h-7 text-amber-400" />
            <h3 className="text-xl">{message}</h3>
          </div>
        </div>
      ) : (
        ""
      )}
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
