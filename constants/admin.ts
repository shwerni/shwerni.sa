// types
import {
  Approval,
  CStatus,
  Category,
  Currency,
  PaymentType,
  Payments,
  RStatus,
  zUsers,
} from "@/types/admin";

// prisma types
import {
  ConsultantState,
  Categories,
  ReviewState,
  PaymentMethod,
  UserRole,
  PaymentState,
  ApprovalState,
} from "@/lib/generated/prisma/enums";
import { FinanceConfig } from "@/types/data";

// categories
export const categories: Category[] = [
  {
    id: Categories.FAMILY,
    label: "استشاري أسري",
    category: "أسري",
    link: "",
    icon: "/svg/home-family.svg",
    status: true,
    style: "bg-green-50 text-green-600",
  },
  {
    id: Categories.PSYCHIC,
    label: "استشاري نفسي",
    category: "نفسي",
    link: "",
    icon: "/svg/masks-psychic.svg",
    status: true,
    style: "bg-blue-50 text-blue-600",
  },
  {
    id: Categories.LAW,
    label: "استشاري قانوني",
    category: "قانوني",
    link: "",
    icon: "/svg/case-law.svg",
    status: true,
    style: "bg-red-50 text-red-600",
  },
  {
    id: Categories.PERSONAL,
    label: "استشاري شخصي",
    category: "شخصي",
    link: "",
    icon: "/svg/ruler-personal.svg",
    status: true,
    style: "bg-amber-50 text-amber-600",
  },
  // {
  //   id: Categories.MEDICINE,
  //   label: "طبيب",
  //   category: "طب",
  //   link: "",
  //   icon: "/svg/doctor.svg",
  //   status: false,
  //   style: "bg-orange-50 text-orange-600",
  // },
];

// consultant status
export const coStatus: CStatus[] = [
  {
    state: ConsultantState.PUBLISHED,
    label: "نشط",
    color: "bg-green-500",
  },
  {
    state: ConsultantState.HOLD,
    label: "بأنتطار المراجعة",
    color: "bg-yellow-500",
  },
  {
    state: ConsultantState.HIDDEN,
    label: "معطل",
    color: "bg-red-500",
  },
];

// consultant status
export const approvalStatus: Approval[] = [
  {
    state: ApprovalState.APPROVED,
    label: "مقبول",
    color: "bg-green-100",
  },
  {
    state: ApprovalState.PENDING,
    label: "بأنتطار المراجعة",
    color: "bg-yellow-100",
  },
  {
    state: ApprovalState.FLAGGED,
    label: "تحت الملاحظة",
    color: "bg-blue-100",
  },
  {
    state: ApprovalState.REJECTED,
    label: "مرفوض",
    color: "bg-red-100",
  },
];

// order status
export const paymentStatuses: PaymentType[] = [
  {
    state: PaymentState.PAID,
    label: "ناجح",
    style: "bg-green-50 text-green-700",
  },
  {
    state: PaymentState.NEW,
    label: "جديد",
    style: "bg-blue-50 text-blue-700",
  },
  {
    state: PaymentState.PROCESSING,
    label: "قيد المراجعة",
    style: "bg-purple-50 text-purple-700",
  },
  {
    state: PaymentState.HOLD,
    label: "قيد الانتظار",
    style: "bg-amber-50 text-amber-700",
  },
  {
    state: PaymentState.REFUSED,
    label: "مرفوض",
    style: "bg-red-50 text-red-700",
  },
  {
    state: PaymentState.REFUND,
    label: "مسترد",
    style: "bg-gray-50 text-black",
  },
  {
    state: PaymentState.CANCELED,
    label: "ملغي",
    style: "bg-slate-100 text-slate-500",
  },
];

// review status
export const reviewStatus: RStatus[] = [
  {
    state: ReviewState.PUBLISHED,
    label: "مقبول",
    color: "bg-green-500",
  },
  {
    state: ReviewState.HOLD,
    label: "انتظار",
    color: "bg-yellow-500",
  },
  {
    state: ReviewState.HIDDEN,
    label: "محجوب",
    color: "bg-red-500",
  },
];

// payment method
export const paymentMethods: Payments[] = [
  {
    label: "البطاقات الإلكترونية",
    description: `الدفع عن طريق\n(فيزا  - مدي - ماستر كارد - ابل باي)`,
    image: "/layout/visa.png",
    mehtod: PaymentMethod.visaMoyasar,
  },
  {
    label: "تابي",
    description: `قسّمها على 4\nبدون أي فوائد، أو رسوم`,
    image: "/layout/tabby.png",
    mehtod: PaymentMethod.tabby,
  },
];

export const currencies: Currency[] = [
  {
    name: "sar",
    label: "ريال سعودي",
    value: "SAR",
    symbole: "﷼",
    tabbyMerchantCode: "Shawrni_sa",
  },
  {
    name: "aed",
    label: "درهم إماراتي",
    value: "AED",
    symbole: "د.إ",
    tabbyMerchantCode: "Shawrni",
  },
  {
    name: "kwd",
    label: "دينار كويتي",
    value: "KWD",
    symbole: "د.ك",
    tabbyMerchantCode: "Shawrni_kw",
  },
  {
    name: "bhd",
    label: "دينار بحريني",
    value: "BHD",
    symbole: ".د.ب",
    tabbyMerchantCode: "Shawrni_bh",
  },
  {
    name: "qar",
    label: "ريال قطري",
    value: "QAR",
    symbole: "ر.ق",
    tabbyMerchantCode: "Shawrni_qa",
  },
  {
    name: "omr",
    label: "ريال عماني",
    value: "OMR",
    symbole: "ر.ع",
    tabbyMerchantCode: "Shawrni_om",
  },
  {
    name: "egp",
    label: "جنيه مصري",
    value: "EGP",
    symbole: "ج.م",
    tabbyMerchantCode: "Shawrni_eg",
  },
];

// users
export const users: zUsers[] = [
  {
    id: 1,
    role: UserRole.ADMIN,
    label: "admin",
    url: "/zadmin/",
    greeting: "Admin! Your command center awaits",
    description: `As an admin, you hold the reins to the platform. Your role is to
          oversee operations, manage users, and ensure that the system runs
          smoothly and securely. Your strategic decisions and leadership help
          shape the success of the platform`,
  },
  {
    id: 2,
    role: UserRole.MANAGER,
    label: "manager",
    url: "/employees/manager/",
    greeting: "مرحبًا أيها المدير! لنحقق النجاح معًا",
    description: `بصفتك مديرًا، أنت الجسر بين الاستراتيجية والتنفيذ. دورك يشمل
          الإشراف على الفرق، مراقبة الأداء، وضمان تحقيق الأهداف بكفاءة.
          أنت القوة الدافعة وراء العمليات السلسة والتعاون الفعّال.`,
  },
  {
    id: 3,
    role: UserRole.SERVICE,
    label: "service",
    url: "/employees/services/",
    greeting: "مرحبًا بك في خدمة العملاء! أنت تصنع الفارق",
    description: `بصفتك متخصصًا في خدمة العملاء، أنت وجه الشركة أمام العملاء.
          دورك يشمل تلبية احتياجات العملاء، حل المشكلات، وتقديم تجارب
          مميزة تعزز الثقة والرضا. تعاطفك ومهاراتك في حل المشكلات لا تقدر بثمن.`,
  },
  {
    id: 4,
    role: UserRole.MARKETER,
    label: "marketer",
    url: "/employees/marketing/",
    greeting: "مرحبًا أيها المسوّق! لنوسع نطاق تأثيرنا",
    description: `بصفتك مسوّقًا، أنت صوت العلامة التجارية. مهمتك هي إنشاء
          حملات جذابة، تحليل اتجاهات السوق، والتفاعل مع الجمهور لتحقيق
          النمو وبناء قاعدة عملاء مخلصة. إبداعك واستراتيجياتك القائمة
          على البيانات تساعد في توسيع نطاق وصولنا.`,
  },
  {
    id: 5,
    role: UserRole.USER,
    label: "user",
    url: "/",
    greeting: "",
    description: "",
  },
  {
    id: 6,
    role: UserRole.OWNER,
    label: "consultant",
    url: "/dashboard",
    greeting: "",
    description: "",
  },
  {
    id: 7,
    role: UserRole.GROUP,
    label: "centers",
    url: "/dashboard",
    greeting: "",
    description: "",
  },
  {
    id: 8,
    role: UserRole.COORDINATOR,
    label: "coordinator",
    url: "/employees/coordinator/",
    greeting: "مرحبًا أيها المستشار المنسق!",
    description: `بصفتك منسقًا، لديك دور أساسي في دعم المستخدمين وتقديم المساعدة
          حسب الحاجة. تساهم في تسهيل العمليات وتحقيق تجربة سلسة للجميع.`,
  },
  {
    id: 9,
    role: UserRole.COLLABORATOR,
    label: "collaborator",
    url: "/collaborator/",
    greeting: "مرحبًا أيها المتعاون! شراكتك تصنع الفارق 🤝",
    description: `بصفتك متعاونًا، أنت شريكنا في النجاح. من خلال مشاركة الروابط الخاصة بك، تساعد في توسيع نطاق وصول المنصة وجذب عملاء جدد. كل طلب يتم من خلالك يُظهر قيمة جهودك ويساهم في نمو مجتمعنا. استمر في التعاون، فنجاحك هو امتداد لنجاحنا.`,
  },
];

// defaults finance
export const defaultFinance: FinanceConfig = {
  tax: 15,
  commission: 60,
  payments: [],
  couponEnabled: false,
};