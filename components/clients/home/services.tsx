// React & Next
import Link from "next/link";

// icons
import {
  Zap,
  Compass,
  Gift,
  Handshake,
  Layers,
  ClipboardCheck,
  TicketPercent,
} from "lucide-react";
import { RiDiamondRingFill } from "react-icons/ri";

export default function Services() {
  const services = [
    {
      label: "الكوبونات",
      desc: "كوبونات خصم",
      link: "/coupons",
      icon: TicketPercent,
      status: true,
    },
    {
      label: "حجز فوري",
      desc: "تواصل مع مستشار متاح فوراً بدون انتظار.",
      link: "/instant",
      icon: Zap,
      status: false,
    },
    {
      label: "جلسة توجيهية",
      desc: "جلسة كتابية قصيرة لتحديد مسارك والمستشار الأنسب لك.",
      link: "/preconsultation",
      icon: Compass,
      status: false,
    },
    {
      label: "جلسة مجانية",
      desc: "اكتشف خدماتنا عبر جلسة تعريفية مجانية بالكامل.",
      link: "/freesessions",
      icon: Gift,
      status: false,
    },
    {
      label: "جلسة صلح",
      desc: "وساطة مهنية لحل الخلافات وتقريب وجهات النظر.",
      link: "/reconciliation",
      icon: Handshake,
      status: false,
    },
    {
      label: "برامجنا",
      desc: "باقات متكاملة وخطط مخصصة لاحتياجاتك العميقة.",
      link: "/programs",
      icon: Layers,
      status: true,
    },
    {
      label: "المقاييس",
      desc: "اختبارات علمية دقيقة لتقييم حالتك النفسية والزوجية.",
      link: "/scales",
      icon: ClipboardCheck,
      status: false,
    },
    {
      label: "مقياس الاستعداد الواعي للزواج",
      desc: "اختبارات علمية دقيقة لتقييم حالتك النفسية والزوجية.",
      link: "/marriage-awareness",
      icon: RiDiamondRingFill,
      status: true,
    },
  ];

  return (
    <div className="space-y-6 mx-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
        {services.map((service, index) => {
          const Icon = service.icon;

          if (!service.status) return;

          return (
            <Link
              key={index}
              href={service.link}
              className="group bg-white rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-50 flex items-start justify-between hover:shadow-md hover:border-theme/30 transition-all duration-300 ease-in-out gap-3"
            >
              {/* النصوص */}
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-theme transition-colors">
                  {service.label}
                </span>
                {/* <p className="text-xs text-gray-500 leading-relaxed pl-2">
                  {service.desc}
                </p> */}
              </div>

              {/* الأيقونة */}
              <div className="text-theme opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shrink-0">
                <Icon strokeWidth={1.5} className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
