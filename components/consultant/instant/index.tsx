"use client";
// import { Bell, Wifi, Clock, Users, Loader2 } from "lucide-react";
// import { useConsultantPresence } from "@/hooks/useOnlineConsultant";

export default function InstantDashboard({ userId }: { userId: string }) {
  // const { connected, onlineCount } = useConsultantPresence({ userId });
  return;
  // if (!connected) {
  //   return (
  //     <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
  //       <div className="relative flex items-center justify-center">
  //         <Loader2 className="w-10 h-10 text-theme animate-spin" />
  //       </div>

  //       <h2 className="mt-6 text-xl font-semibold text-theme">
  //         جاري الاتصال بالخادم...
  //       </h2>

  //       <p className="mt-2 text-sm text-gray-500">
  //         يتم تفعيل حالتك كـ متاح للعملاء
  //       </p>

  //       <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
  //         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
  //         انتظار الاتصال
  //       </div>
  //     </div>
  //   );
  // }

  // return (
  //   <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
  //     <div className="text-center">
  //       <h2 className="text-3xl font-semibold mb-1 text-theme">
  //         ⚡ أنت الآن متصل
  //       </h2>
  //       <p className="text-gray-600 text-sm">
  //         ابقَ على هذه الصفحة لتبقى متاحًا للعملاء مباشرة
  //       </p>
  //     </div>

  //     {/* Icons & Info */}
  //     <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
  //       <div className="flex flex-col items-center space-y-1">
  //         <Wifi className="w-6 h-6 text-green-500" />
  //         <span className="text-sm font-medium text-gray-800">اتصال مباشر</span>
  //         <p className="text-xs text-gray-500">العملاء يرونك متاحًا</p>
  //       </div>

  //       <div className="flex flex-col items-center space-y-1">
  //         <Users className="w-6 h-6 text-blue-500" />
  //         <span className="text-sm font-medium text-gray-800">العملاء</span>
  //         <p className="text-xs text-gray-500">استقبل طلبات الجلسات فورًا</p>
  //       </div>

  //       <div className="flex flex-col items-center space-y-1">
  //         <Clock className="w-6 h-6 text-purple-500" />
  //         <span className="text-sm font-medium text-gray-800">الوقت</span>
  //         <p className="text-xs text-gray-500">كل دقيقة على الصفحة = متاح</p>
  //       </div>

  //       <div className="flex flex-col items-center space-y-1">
  //         <Bell className="w-6 h-6 text-yellow-500" />
  //         <span className="text-sm font-medium text-gray-800">تنبيهات</span>
  //         <p className="text-xs text-gray-500">
  //           ستتلقى إشعارات للجلسات الجديدة
  //         </p>
  //       </div>
  //     </div>

  //     <div className="flex flex-col items-center space-y-3 pt-6">
  //       <div className="flex items-center gap-3">
  //         <span className="relative flex h-3 w-3">
  //           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
  //           <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
  //         </span>

  //         <p className="text-sm text-gray-500">عدد العملاء المتواجدين الآن</p>
  //       </div>

  //       <div className="text-4xl font-bold text-theme tracking-tight">
  //         {onlineCount ?? 0}
  //       </div>

  //       <p className="text-xs text-gray-400 text-center max-w-xs">
  //         كلما بقيت متصلًا زادت فرص ظهورك للعملاء الجدد
  //       </p>
  //     </div>

  //     <footer className="text-center mt-auto">
  //       <p className="text-gray-700 font-medium text-sm">
  //         ⚠️ لا تغلق الصفحة أو تغادرها لتبقى متاحًا للعملاء
  //       </p>
  //     </footer>
  //   </div>
  // );
}
