// constants
import { mainRoute } from "@/constants/links";

// types
import { TimeMeta } from "@/types/admin";

// initial times
export const itimes: Record<string, TimeMeta> = {
  "00:00": { label: "12:00 صباحاً", phase: "late" },
  "00:30": { label: "12:30 صباحاً", phase: "late" },
  "01:00": { label: "01:00 صباحاً", phase: "late" },
  "01:30": { label: "01:30 صباحاً", phase: "late" },
  "02:00": { label: "02:00 صباحاً", phase: "late" },
  "02:30": { label: "02:30 صباحاً", phase: "late" },
  "03:00": { label: "03:00 صباحاً", phase: "late" },
  "03:30": { label: "03:30 صباحاً", phase: "late" },
  "04:00": { label: "04:00 صباحاً", phase: "late" },
  "04:30": { label: "04:30 صباحاً", phase: "late" },
  "05:00": { label: "05:00 صباحاً", phase: "day" },
  "05:30": { label: "05:30 صباحاً", phase: "day" },
  "06:00": { label: "06:00 صباحاً", phase: "day" },
  "06:30": { label: "06:30 صباحاً", phase: "day" },
  "07:00": { label: "07:00 صباحاً", phase: "day" },
  "07:30": { label: "07:30 صباحاً", phase: "day" },
  "08:00": { label: "08:00 صباحاً", phase: "day" },
  "08:30": { label: "08:30 صباحاً", phase: "day" },
  "09:00": { label: "09:00 صباحاً", phase: "day" },
  "09:30": { label: "09:30 صباحاً", phase: "day" },
  "10:00": { label: "10:00 صباحاً", phase: "day" },
  "10:30": { label: "10:30 صباحاً", phase: "day" },
  "11:00": { label: "11:00 صباحاً", phase: "day" },
  "11:30": { label: "11:30 صباحاً", phase: "day" },
  "12:00": { label: "12:00 مساءً", phase: "noon" },
  "12:30": { label: "12:30 مساءً", phase: "noon" },
  "13:00": { label: "01:00 مساءً", phase: "noon" },
  "13:30": { label: "01:30 مساءً", phase: "noon" },
  "14:00": { label: "02:00 مساءً", phase: "noon" },
  "14:30": { label: "02:30 مساءً", phase: "noon" },
  "15:00": { label: "03:00 مساءً", phase: "noon" },
  "15:30": { label: "03:30 مساءً", phase: "noon" },
  "16:00": { label: "04:00 مساءً", phase: "noon" },
  "16:30": { label: "04:30 مساءً", phase: "noon" },
  "17:00": { label: "05:00 مساءً", phase: "night" },
  "17:30": { label: "05:30 مساءً", phase: "night" },
  "18:00": { label: "06:00 مساءً", phase: "night" },
  "18:30": { label: "06:30 مساءً", phase: "night" },
  "19:00": { label: "07:00 مساءً", phase: "night" },
  "19:30": { label: "07:30 مساءً", phase: "night" },
  "20:00": { label: "08:00 مساءً", phase: "night" },
  "20:30": { label: "08:30 مساءً", phase: "night" },
  "21:00": { label: "09:00 مساءً", phase: "night" },
  "21:30": { label: "09:30 مساءً", phase: "night" },
  "22:00": { label: "10:00 مساءً", phase: "night" },
  "22:30": { label: "10:30 مساءً", phase: "night" },
  "23:00": { label: "11:00 مساءً", phase: "night" },
  "23:30": { label: "11:30 مساءً", phase: "night" },
};

export const iHours: string[] = [
  "00:00",
  "00:30",
  "01:00",
  "01:30",
  "02:00",
  "02:30",
  "03:00",
  "03:30",
  "04:00",
  "04:30",
  "05:00",
  "05:30",
  "06:00",
  "06:30",
  "07:00",
  "07:30",
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
  "23:30",
];

// constants months
export const zMonths = [
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
];

// zencrypt
export const zencrypt: string[] = [
  "b",
  "z",
  "q",
  "o",
  "l",
  "w",
  "m",
  "k",
  "y",
  "u",
];

// zdencrypt
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const zdencrypt: any = {
  b: 0,
  z: 1,
  q: 2,
  o: 3,
  l: 4,
  w: 5,
  m: 6,
  k: 7,
  y: 8,
  u: 9,
};

// default meta data api
export const defaultMetaApi = {
  title: "شاورني",
  description: "شاورني هي منصة سعودية تربطك بأفضل المستشارين بكل خصوصية وسرية.",
  keywords: [
    // الاسم والمنصة
    "شاورني",
    "shwerni",
    "منصة شاورني",
    "شاوني",

    // استشارات عامة
    "منصة استشارات سعودية",
    "استشارات أونلاين",
    "جلسات استشارية",
    "استشارة نفسية",
    "استشارة أسرية",
    "استشارة زوجية",
    "استشارة قانونية",

    // مستشارين واختصاصات
    "مستشار نفسي",
    "مستشار أسري",
    "مستشار قانوني",
    "مستشار مهني",
    "أخصائي نفسي",
    "مستشار تربوي",
    "خبير علاقات",
    "خبير قانوني",

    // تخصصات مهمة
    "علاج القلق",
    "علاج الاكتئاب",
    "علاج الوسواس",
    "النرجسية",
    "اكتشاف نمط الشخصية",
    "صعوبات نفسية",
    "مشاكل زوجية",
    "الخيانة الزوجية",

    // كلمات أجنبية تدعم الفهرسة
    "Psychological support",
    "Online therapy",
    "Mental health counseling",
    "Marriage counseling",
    "Family therapy",
    "Saudi consultant platform",

    // قيم مضافة
    "استشارات بسرية",
    "جلسات نفسية عن بعد",
    "أفضل مستشارين في السعودية",
    "حجز استشارة فورية",
    "استشارة مجانية",
    "منصة موثوقة للاستشارات",
  ],
  openGraph: {
    type: "website",
    url: mainRoute,
    title: "شاورني - shwerni",
    siteName: "شاورني - shwerni",
    description:
      "منصة استشارات سعودية تساعدك في الوصول إلى أفضل المستشارين بسرية وخصوصية تامة.",
    images: [
      {
        url: `${mainRoute}layout/shwerni.jpg`,
        alt: "shwerni - شاورني",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شاورني - shwerni",
    description: "منصة سعودية للاستشارات النفسية والأسرية بكل خصوصية.",
    creator: "@shwernisa",
    images: [
      {
        url: `${mainRoute}layout/shwerni.jpg`,
        alt: "shwerni - شاورني",
        width: 1200,
        height: 630,
        type: "image/jpg",
      },
    ],
  },
  icons: `${mainRoute}favicon.ico`,
};
