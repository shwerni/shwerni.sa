// React & Next
import Link from "next/link";

// componments
import { Button } from "@/components/ui/button";
import MLogo from "@/app/_components/layout/logo";
import { Separator } from "@/components/ui/separator";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// constants
import { mainLinks } from "@/constants/menu";

// icon
import { CircleX } from "lucide-react";
import { TriangleAlert } from "lucide-react";

// props
interface Props {
  role: UserRole | undefined;
}

const RoleError: React.FC<Props> = ({ role }) => {
  // message
  const messages: Partial<Record<UserRole, string>> = {
    [UserRole.OWNER]: "بالمستشارين",
    [UserRole.GROUP]: "بالمراكز",
    [UserRole.USER]: "بالعملاء",
    [UserRole.SERVICE]: "بخدمة العملاء",
    [UserRole.MARKETER]: "بالتسويق",
    [UserRole.ADMIN]: "بالادارة",
    [UserRole.MANAGER]: "بالادارة",
    [UserRole.COLLABORATOR]: "بالمتعاونون",
  };

  // message
  const message = role ? messages[role] : "";

  //not found page content
  return (
    <div className="cflex gap-5 min-h-screen" dir="rtl">
      <div className="cflex gap-10">
        {/* error message  */}
        <div className="cflex gap-5 sm:gap-10">
          {/* logo */}
          <MLogo />
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
        <div className="cflex">
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
        </div>
      </div>
      {/* alert if user */}
      <div className="cflex gap-3 max-w-[400px] w-11/12 mx-auto">
        {/* role alert */}
        <Alert
          variant="destructive"
          className="flex flex-row  items-start gap-3"
        >
          <div>
            <TriangleAlert className="relative! w-5" />
          </div>
          <div className="flex flex-col items-start gap-1">
            <AlertTitle>خطأ</AlertTitle>
            <AlertDescription>
              هذه الصفحة خاصة {message} برجاء تسجيل الخروج من حسابك الحالي
              وتسجيل الدخول بحساب خاص {message}
            </AlertDescription>
          </div>
        </Alert>
        {/* sign out button */}
        <Link href="/auth/signout">
          <Button className="bg-red-500 mx-auto">تسجيل الخروج</Button>
        </Link>
      </div>
    </div>
  );
};

export default RoleError;
