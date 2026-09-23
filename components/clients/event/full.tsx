// components
import { LinkButton } from "@/components/shared/link-button";

// constants
import { EVENT_MAX_RESERVATIONS_PER_CONSULTANT } from "@/components/clients/event/constant";

// icons
import {
  CalendarCheck,
  ChevronLeft,
  Home,
  Sparkles,
  Users,
} from "lucide-react";

const EventConsultantFull = () => {
  return (
    <div dir="rtl" className="flex items-center justify-center py-16 px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white ring-1 ring-theme/20 shadow-sm p-8 text-center space-y-6">
        {/* decorative sparkles */}
        <Sparkles className="absolute top-5 right-6 w-4 h-4 text-theme/40" />
        <Sparkles className="absolute bottom-6 left-6 w-5 h-5 text-theme-700/30" />

        {/* icon */}
        <div className="mx-auto flex items-center justify-center w-20 h-20 rounded-full bg-theme-50 ring-8 ring-theme-50/50">
          <CalendarCheck className="w-10 h-10 text-theme" />
        </div>

        {/* text */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-theme-900">
            اكتملت حجوزات هذا المستشار
          </h2>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            شكرًا لاهتمامك! امتلأت جميع جلسات هذا المستشار في عرض اليوم الوطني،
            ولا يزال بإمكانك حجز جلستك المجانية مع مستشار آخر
          </p>
        </div>

        {/* capacity badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-theme-50 text-theme-900 ring-1 ring-theme/30 px-4 py-1.5 text-xs sm:text-sm font-semibold">
          <Users className="w-4 h-4" />
          {EVENT_MAX_RESERVATIONS_PER_CONSULTANT} من{" "}
          {EVENT_MAX_RESERVATIONS_PER_CONSULTANT} جلسات محجوزة
        </div>

        {/* actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <LinkButton
            href="/event"
            variant="primary"
            className="w-full sm:w-auto px-6 bg-theme hover:bg-theme-700 items-center"
          >
            اختر مستشارًا آخر
            <ChevronLeft className="w-4 h-4" />
          </LinkButton>

          <LinkButton
            href="/"
            variant="secondary"
            className="w-full sm:w-auto px-6 items-center"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </LinkButton>
        </div>
      </div>
    </div>
  );
};

export default EventConsultantFull;
