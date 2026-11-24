// React & Next
import Link from "next/link";

// components
import { Button } from "@/components/ui/button";

// constants
import { contactUs } from "@/constants/data";

// icons
import { Link2Off, MessageCircle } from "lucide-react";

// the customer service whatsapp (the contact-us number)
const supportWhatsapp =
  contactUs.find((item) => item.link.startsWith("https://wa.me/"))?.link ?? "";

/**
 * an old or invalid reschedule link (a bare link, a wrong token, no consultant session): the
 * same look as the reschedule page's other states, no login, a way to customer service
 */
export default function ExpiredRescheduleLink() {
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-2 my-5 space-y-8">
      <div className="flex flex-col items-center justify-center gap-1.5">
        <h3 className="text-theme font-semibold text-lg">إعادة جدولة الجلسة</h3>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
          <Link2Off className="text-amber-500 w-8 h-8" />
        </div>
        <h3 className="text-sm font-medium text-foreground leading-relaxed max-w-sm">
          انتهت صلاحية هذا الرابط، اضغط زر إعادة الجدولة في رسالة واتساب مرة أخرى
          للحصول على رابط جديد
        </h3>
        {supportWhatsapp && (
          <Link href={supportWhatsapp} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="sm" className="mt-2 gap-1">
              <MessageCircle className="w-4 h-4" />
              تواصل مع خدمة العملاء
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
