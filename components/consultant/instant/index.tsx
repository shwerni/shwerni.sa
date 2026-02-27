import { Bell, Wifi, Clock, Users } from "lucide-react";
import { updateOnlineAt } from "@/data/online";
import { OnlineStatus } from "@/lib/generated/prisma/enums";

export default async function InstantDashboard({ userId }: { userId: string }) {
  //  await updateOnlineAt(userId, OnlineStatus.ONLINE);
  return;
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-semibold mb-1 text-theme">
          ⚡ أنت الآن متصل
        </h1>
        <p className="text-gray-600 text-sm">
          ابقَ على هذه الصفحة لتبقى متاحًا للعملاء مباشرة
        </p>
      </div>

      {/* Icons & Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
        <div className="flex flex-col items-center space-y-1">
          <Wifi className="w-6 h-6 text-green-500" />
          <span className="text-sm font-medium text-gray-800">اتصال مباشر</span>
          <p className="text-xs text-gray-500">العملاء يرونك متاحًا</p>
        </div>

        <div className="flex flex-col items-center space-y-1">
          <Users className="w-6 h-6 text-blue-500" />
          <span className="text-sm font-medium text-gray-800">العملاء</span>
          <p className="text-xs text-gray-500">استقبل طلبات الجلسات فورًا</p>
        </div>

        <div className="flex flex-col items-center space-y-1">
          <Clock className="w-6 h-6 text-purple-500" />
          <span className="text-sm font-medium text-gray-800">الوقت</span>
          <p className="text-xs text-gray-500">كل دقيقة على الصفحة = متاح</p>
        </div>

        <div className="flex flex-col items-center space-y-1">
          <Bell className="w-6 h-6 text-yellow-500" />
          <span className="text-sm font-medium text-gray-800">تنبيهات</span>
          <p className="text-xs text-gray-500">
            ستتلقى إشعارات للجلسات الجديدة
          </p>
        </div>
      </div>

      {/* Footer / Reminder */}
      <footer className="text-center mt-auto">
        <p className="text-gray-700 font-medium text-sm">
          ⚠️ لا تغلق الصفحة أو تغادرها لتبقى متاحًا للعملاء
        </p>
      </footer>
    </div>
  );
}
