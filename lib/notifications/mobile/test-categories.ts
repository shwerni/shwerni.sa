export interface TestCategoryPreset {
  title: string;
  description: string;
  category?: string;
  targetId?: string;
  redirection?: string;
  ctaLabel?: string;
  actionCategory?: string;
}

// one preset per notification category, used by the test routes so every
// category can be exercised end to end (real db row + real push) from the
// mobile test screen without hand-writing copy each time
export const TEST_CATEGORIES: Record<string, TestCategoryPreset> = {
  INFO: {
    title: "تنبيه هام",
    description:
      "تم تحديث سياسة الخصوصية الخاصة بنا. يمكنك الاطلاع على التفاصيل من داخل التطبيق.",
  },
  READ_ONLY_TEST: {
    title: "اختبار القراءة",
    description:
      "هذا إشعار تجريبي، اضغط زر تم فقط للتأكد أنه يعلم كمقروء دون فتح أي صفحة.",
    actionCategory: "mark-done-only",
  },
  SESSION_REMINDER: {
    title: "تذكير بالجلسة",
    description:
      "جلستك الاستشارية تبدأ خلال وقت قصير. يرجى الحرص على الحضور في الموعد المحدد لضمان الاستفادة الكاملة من الوقت.",
    category: "SESSION_REMINDER",
    targetId: "test-reservation-id",
    actionCategory: "reservation-reminder",
  },
  REVIEW_REMINDER: {
    title: "شاركنا رأيك",
    description:
      "كيف كانت تجربتك مع المستشار؟ خذ لحظة لتقييم الجلسة، فرأيك يساعدنا ويساعد الآخرين على الاختيار الصحيح.",
    category: "REVIEW_REMINDER",
    targetId: "test-consultant-id",
  },
  MARKETING_CONSULTANTS: {
    title: "احجز الآن، لا تنتظر أكثر!",
    description:
      "فريق من أفضل المستشارين المحترفين بانتظارك لمساعدتك على تحقيق أهدافك. سواء كنت تبحث عن استشارة قانونية أو مالية أو مهنية، ستجد الخبير المناسب لك خلال دقائق. لا تفوّت الفرصة وابدأ رحلتك نحو حلول أفضل اليوم.",
    category: "MARKETING_CONSULTANTS",
  },
  COUPON: {
    title: "كوبون خصم خاص لك 🎁",
    description:
      "احصل على خصم فوري على جلستك القادمة! استخدم الكوبون قبل انتهاء صلاحيته واستفد من العرض المحدود.",
    category: "COUPON",
  },
  SEASONAL_OFFER: {
    title: "لا تفوّت عروض عيد الأضحى 🐑",
    description:
      "بمناسبة عيد الأضحى المبارك، نقدّم لكم خصومات مميزة على جميع الاستشارات لفترة محدودة. احجز الآن واستفد من العرض قبل انتهائه.",
    category: "SEASONAL_OFFER",
  },
  CUSTOM_LINK: {
    title: "إشعار برابط مخصص",
    description:
      "هذا مثال على إشعار يفتح رابطًا محددًا وزرًا مخصصًا دون الاعتماد على تصنيف جاهز.",
    redirection: "/consultants",
    ctaLabel: "افتح الرابط المخصص",
  },
};