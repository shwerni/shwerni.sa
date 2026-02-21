// componenets
import Logo from "@/components/shared/logo";
import LogOutForm from "@/components/auth/logout-form";
import { Card, CardContent, CardDescription, CardTitle } from "../ui/card";

// types
import { User } from "next-auth";
import Link from "next/link";
import { ArrowRight, LogOutIcon } from "lucide-react";
import { UserRole } from "@/lib/generated/prisma/enums";

// props
interface Props {
  user?: User;
}

const LogOut = ({ user }: Props) => {
  return (
    <div className="flex flex-col justify-center items-center gap-8 min-h-screen px-5">
      {/* log in card */}
      <Card className="w-full max-w-md p-8 shadow-lg border-slate-200 text-center">
        <CardDescription className="hidden"/>
        <CardTitle className="hidden"/>
        <div className="w-16 h-16 bg-theme/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogOutIcon className="w-8 h-8 text-theme" />
        </div>
        {/* main logo */}
        <div className="flex justify-center">
          <Logo width={200} height={200} />
        </div>
        <h1 className="text-3xl text-[#094577] font-bold">تسجيل الخروج</h1>
        <p className="text-sm text-slate-600 font-medium">
          هل أنت متأكد من رغبتك في تسجيل الخروج من حسابك؟
        </p>
        {/* user data */}
        <CardContent className="flex flex-col gap-3 w-11/12 mx-auto px-0 py-2">
          <div className="flex justify-between">
            <h4 className="text-sm">اسم المستخدم</h4>
            <h4 className="font-bold text-sm text-zblue-200">{user?.name}</h4>
          </div>
          <div className="flex justify-between">
            <h4 className="text-sm">رقم الهاتف</h4>
            <h4 className="font-bold text-sm text-zblue-200">{user?.phone}</h4>
          </div>
        </CardContent>
        {/* log out buttons */}
        <LogOutForm role={user?.role} />
        {/* back */}
        {user?.role !== UserRole.USER && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:underline text-sm flex items-center justify-center gap-2"
            >
              <ArrowRight size={16} />
              العودة إلى لوحة التحكم
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LogOut;
