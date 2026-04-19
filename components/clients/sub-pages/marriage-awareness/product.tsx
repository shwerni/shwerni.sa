import CurrencyLabel from "@/components/clients/shared/currency-label";
import { Brain, CalendarCheck, ClipboardList } from "lucide-react";

const included = [
  {
    Icon: ClipboardList,
    title: "تطبيق المقياس",
    desc: "مقياس علمي معتمد لقياس جاهزيتك للزواج",
    color: "text-blue-600 bg-blue-50",
  },
  {
    Icon: Brain,
    title: "تحليل النتائج",
    desc: "جلسة ساعة كاملة لمناقشة وتحليل نتائجك",
    color: "text-purple-600 bg-purple-50",
  },
  {
    Icon: CalendarCheck,
    title: "خطة عملية",
    desc: "توصيات مخصصة بناءً على نتيجتك",
    color: "text-emerald-600 bg-emerald-50",
  },
];

export default function ProductCard() {
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-6 space-y-4">
      {/* title */}
      <div className="text-center space-y-1">
        <span className="text-xs font-medium text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
          حزمة متكاملة
        </span>
        <h1 className="text-xl font-bold text-[#094577] mt-2">
          مقياس جاهزية الوعي للزواج
        </h1>
        <p className="text-sm text-gray-500">
          اكتشف مدى جاهزيتك النفسية والعاطفية للزواج
        </p>
      </div>

      {/* divider */}
      <div className="border-t border-gray-100" />

      {/* items */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {included.map((item) => (
          <div
            key={item.title}
            className="flex sm:flex-col items-center sm:items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
          >
            <div className={`p-2 rounded-lg ${item.color} shrink-0`}>
              <item.Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {item.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="inline-flex items-center gap-2">
          <CurrencyLabel amount={304} className="text-xl font-bold" tax={15} />
          <h6 className="text-gray-500 font-light text-xs">شامل الضريبة</h6>
        </div>
        <span className="text-sm text-gray-400">
          بدلاً من{" "}
          <CurrencyLabel
            amount={426}
            className="line-through"
            size="xs"
            tax={15}
          />
        </span>
      </div>
    </div>
  );
}
