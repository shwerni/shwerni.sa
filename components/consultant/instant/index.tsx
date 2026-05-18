"use client";
// React & Next
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// hooks
import { useConsultantPresence } from "@/hooks/useOnlineConsultant";

// icons
import { Bell, Wifi, Clock, Users, Loader2 } from "lucide-react";

export default function InstantDashboard({ userId }: { userId: string }) {
  const { connected, onlineCount } = useConsultantPresence({ userId });
  const router = useRouter();

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const popupIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clears all timers
  const clearAllTimers = () => {
    if (popupIntervalRef.current) clearInterval(popupIntervalRef.current);
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
  };

  // opens popup and starts 45s countdown
  const openPopup = () => {
    // 1. Clear any existing timers first to prevent orphaned redirects
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);

    setShowPopup(true);
    setCountdown(45);

    // Tick countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Time's up — redirect
          clearAllTimers();
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // safety redirect after 45s
    redirectTimeoutRef.current = setTimeout(() => {
      clearAllTimers();
      router.push("/dashboard");
    }, 45_000);
  };

  // User confirmed presence
  const handleConfirm = () => {
    // Clear countdown/redirect timers
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);
    if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);

    // 2. CRITICAL FIX: Clear the old popup interval before starting a new one!
    if (popupIntervalRef.current) clearInterval(popupIntervalRef.current);

    setShowPopup(false);

    // Schedule next popup in 10 minutes
    popupIntervalRef.current = setInterval(
      () => {
        openPopup();
      },
      10 * 60 * 1000,
    );
  };

  // Start the 10-minute cycle once connected
  useEffect(() => {
    if (!connected) return;

    // First popup after 10 minutes
    popupIntervalRef.current = setInterval(
      () => {
        openPopup();
      },
      10 * 60 * 1000,
    );

    return () => clearAllTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected]);

  if (!connected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="relative flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-theme animate-spin" />
        </div>

        <h2 className="mt-6 text-xl font-semibold text-theme">
          جاري الاتصال بالخادم...
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          يتم تفعيل حالتك كـ متاح للعملاء
        </p>

        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          انتظار الاتصال
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-semibold mb-1 text-theme">
            ⚡ أنت الآن متصل
          </h2>
          <p className="text-gray-600 text-sm">
            ابقَ على هذه الصفحة لتبقى متاحًا للعملاء مباشرة
          </p>
        </div>

        {/* Icons & Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div className="flex flex-col items-center space-y-1">
            <Wifi className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium text-gray-800">
              اتصال مباشر
            </span>
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

        <div className="flex flex-col items-center space-y-3 pt-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>

            <p className="text-sm text-gray-500">عدد العملاء المتواجدين الآن</p>
          </div>

          <div className="text-4xl font-bold text-theme tracking-tight">
            {onlineCount ?? 0}
          </div>

          <p className="text-xs text-gray-400 text-center max-w-xs">
            كلما بقيت متصلًا زادت فرص ظهورك للعملاء الجدد
          </p>
        </div>

        <footer className="text-center mt-auto">
          <p className="text-gray-700 font-medium text-sm">
            ⚠️ لا تغلق الصفحة أو تغادرها لتبقى متاحًا للعملاء
          </p>
        </footer>
      </div>

      {/* Presence confirmation popup */}
      {showPopup && (
        <div
          dir="rtl"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center space-y-5">
            {/* Pulsing indicator */}
            <div className="flex justify-center">
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-800">
              هل لا تزال متصلاً؟
            </h3>

            <p className="text-sm text-gray-500">
              سيتم تسجيل خروجك تلقائيًا إذا لم تُجِب
            </p>

            {/* Countdown ring */}
            <div className="flex items-center justify-center">
              <div className="relative w-16 h-16">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 36 36"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeDasharray="100"
                    strokeDashoffset={100 - (countdown / 45) * 100}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-700">
                  {countdown}
                </span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-semibold text-base"
            >
              نعم، أنا هنا ✓
            </button>
          </div>
        </div>
      )}
    </>
  );
}
