// types
import { Link } from "@/types/layout";

// lucide icons
import {
  CreditCard,
  Heart,
  Settings,
  User,
  Home,
  ShoppingBag,
  Zap,
  NotebookPen,
  Users,
  Phone,
  Clock,
  UsersRound,
  Video,
  Wallet,
  FlaskConical,
  Star,
  MessageCircleQuestion,
  MessageCircleQuestionIcon,
  CircleDollarSign,
  BookOpen,
  BadgePercent,
  Upload,
  GalleryVerticalEnd,
  SquareTerminal,
  MessageSquareMore,
  PencilRuler,
  CalendarDays,
  MessageSquareWarning,
  Gift,
  BookText,
  NotebookText,
  Newspaper,
  CirclePercent,
  CheckCheck,
} from "lucide-react";

// react icons
import { IoMdPaper } from "react-icons/io";
import { FaChartBar } from "react-icons/fa";

// home menu
export const menu: Link[] = [
  {
    label: "الملف الشخصي",
    link: "/account",
    icon: User,
    status: true,
  },
  {
    label: "المحفظة",
    link: "/wallet",
    icon: Wallet,
    status: false,
  },
  {
    label: "طلباتي",
    link: "/orders",
    icon: ShoppingBag,
    status: true,
  },
  {
    label: "المفضلة",
    link: "/favorite",
    icon: Heart,
    status: true,
  },
];

// home pagaes
export const subMenu: Link[] = [
  {
    label: "سؤال و جواب",
    link: "/questions",
    icon: MessageCircleQuestionIcon,
    status: false,
  },
  {
    label: "مناسبات",
    link: "/events",
    icon: CalendarDays,
    status: false,
  },
  {
    label: "المدونة",
    link: "/articles",
    icon: Newspaper,
    status: true,
  },
  {
    label: "معلومات قد تهمك",
    link: "/information",
    icon: BookOpen,
    status: false,
  },
];

// home pagaes
export const navLinks: Link[] = [
  {
    label: "الرئيسية",
    link: "/",
    icon: Home,
  },
  {
    label: "المستشارون",
    link: "/consultants",
    icon: Users,
  },
  {
    label: "المدونة",
    link: "/articles",
    icon: Newspaper,
  },
  {
    label: "كيف يمكننا مساعدتك ؟",
    link: "/contact-us",
    icon: Phone,
  },
];

export const mainLinks: Link[] = [
  {
    label: "الرئيسية",
    link: "/",
    icon: Home,
  },
  {
    label: "المستشارون",
    link: "/consultants",
    icon: Users,
  },
  {
    label: "المدونة",
    link: "/articles",
    icon: Newspaper,
  },
];

// home sub pagaes
export const subPages: Link[] = [
  {
    label: "البرامج",
    link: "/programs",
    icon: NotebookText,
    status: true,
  },
  {
    label: "حجز فوري",
    link: "/instant",
    icon: Zap,
    status: true,
  },
  {
    label: "جلسة توجيهية",
    link: "/preconsultation",
    icon: MessageSquareWarning,
    status: true,
  },
  {
    label: "جلسة مجانية",
    link: "/freesession",
    icon: Gift,
    status: true,
  },
];

// constultant dashboard menu owners
export const cdashboard: Link[] = [
  {
    label: "اعلاني",
    link: "",
    icon: User,
    status: true,
  },
  {
    label: "المواقيت",
    link: "/timings",
    icon: Clock,
    status: true,
  },
  {
    label: "حجز فوري",
    link: "/instant",
    icon: Zap,
    status: true,
  },
  {
    label: "الطلبات",
    link: "/orders",
    icon: ShoppingBag,
    status: true,
  },
  {
    label: "المستحقات",
    link: "/dues",
    icon: CreditCard,
    status: true,
  },
  {
    label: "الكوبونات",
    link: "/coupons",
    icon: BadgePercent,
    status: true,
  },
  {
    label: "الخصومات",
    link: "/discounts",
    icon: CirclePercent,
    status: true,
  },
  {
    label: "الجلسات المجانية",
    link: "/freesession",
    icon: Gift,
    status: true,
  },
  {
    label: "التعليقات",
    link: "/reviews",
    icon: MessageSquareMore,
    status: false,
  },
  {
    label: "الاعدادت",
    link: "/profile",
    icon: Settings,
    status: true,
  },
  {
    label: "البرامج",
    link: "/programs",
    icon: BookText,
    status: true,
  },
];

// admin dashboard menu owners
export const adminMenu = {
  user: {
    name: "zadmin",
    email: "aml@gmail.com",
    avatar: "",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  centers: [
    {
      title: "enterprise",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "centers",
          url: "#",
        },
        {
          title: "consutltants",
          url: "#",
        },
      ],
    },
  ],
  tools: [
    {
      title: "tools",
      url: "/tools",
      icon: PencilRuler,
      isActive: true,
      items: [
        {
          title: "contacts",
          url: "/contacts",
        },
      ],
    },
  ],
  reservation: [
    {
      name: "orders",
      url: "/orders",
      icon: ShoppingBag,
    },
    {
      name: "meetings",
      url: "/meetings",
      icon: Video,
    },
    {
      name: "instant",
      url: "/instant",
      icon: Zap,
    },
    {
      name: "dues",
      url: "/dues",
      icon: CircleDollarSign,
    },
  ],
  freesessions: [
    {
      name: "sessions",
      url: "/freesessions",
      icon: Gift,
    },
    {
      name: "available",
      url: "/freetimings",
      icon: Clock,
    },
  ],
  users: [
    {
      name: "users",
      url: "/users",
      icon: User,
    },
  ],
  consultants: [
    {
      name: "approved",
      url: "/consultants",
      icon: CheckCheck,
    },
    {
      name: "applicants",
      url: "/applicants",
      icon: UsersRound,
    },
  ],
  other: [
    {
      name: "reviews",
      url: "/reviews",
      icon: Star,
    },
    {
      name: "programs",
      url: "/programs",
      icon: NotebookText,
    },
    {
      name: "chat",
      url: "/chat",
      icon: MessageSquareMore,
    },
    {
      name: "wallets",
      url: "/wallets",
      icon: Wallet,
    },
    {
      name: "coupons",
      url: "/coupons",
      icon: BadgePercent,
    },
    {
      name: "uploads",
      url: "/uploads",
      icon: Upload,
    },
    {
      name: "questions",
      url: "/questions",
      icon: MessageCircleQuestion,
    },
    {
      name: "blogs",
      url: "/blogs",
      icon: NotebookPen,
    },
    {
      name: "articles",
      url: "/articles",
      icon: Newspaper,
    },
    {
      name: "pre consultation",
      url: "/preconsultation",
      icon: IoMdPaper,
    },
  ],
  platform: [
    {
      name: "statistics",
      url: "/statistics",
      icon: FaChartBar,
    },
    {
      name: "testing",
      url: "/test",
      icon: FlaskConical,
    },
    {
      name: "settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

// manager dashboard menu owners
export const managerMenu = {
  teams: [
    {
      name: "شاورني",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  reservation: [
    {
      name: "الطلبات",
      url: "/orders",
      icon: ShoppingBag,
    },
    {
      name: "الاجتماعات",
      url: "/meetings",
      icon: Video,
    },
    {
      name: "المستحقات",
      url: "/dues",
      icon: CircleDollarSign,
    },
    {
      name: "حجز فوري",
      url: "/instant",
      icon: Zap,
    },
  ],
  consultants: [
    {
      name: "مقبول",
      url: "/consultants",
      icon: CheckCheck,
    },
    {
      name: "متقدمين",
      url: "/applicants",
      icon: UsersRound,
    },
  ],
  other: [
    {
      name: "البرامج",
      url: "/programs",
      icon: NotebookText,
    },
    {
      name: "مقالات شاورني",
      url: "/articles",
      icon: Newspaper,
    },
    {
      name: "الجلسات المجانية",
      url: "/freesessions",
      icon: Gift,
    },
    {
      name: "التقييمات",
      url: "/reviews",
      icon: Star,
    },
    {
      name: "الجلسات التوجيهية",
      url: "/preconsultation",
      icon: IoMdPaper,
    },
    {
      name: "الإحصائيات",
      url: "/statistics",
      icon: FaChartBar,
    },
  ],
};

// marketing dashboard menu owners
export const marketingMenu = {
  teams: [
    {
      name: "شاورني",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  marketing: [
    // {
    //   name: "الطلبات",
    //   url: "/orders",
    //   icon: ShoppingBag,
    // },
    {
      name: "مقالات شاورني",
      url: "/articles",
      icon: Newspaper,
    },
    {
      name: "الإحصائيات",
      url: "/statistics",
      icon: FaChartBar,
    },
  ],
};

// customer services dashboard menu owners
export const servicesMenu = {
  teams: [
    {
      name: "شاورني",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  services: [
    {
      name: "الطلبات",
      url: "/orders",
      icon: ShoppingBag,
    },
    {
      name: "الاجتماعات",
      url: "/meetings",
      icon: Video,
    },
    {
      name: "التقييمات",
      url: "/reviews",
      icon: Star,
    },
    {
      name: "الجلسات المجانية",
      url: "/freesessions",
      icon: Gift,
    },
  ],
};

export const coordinatorMenu = {
  coordinators: [
    {
      name: "الجلسات التوجيهية",
      url: "/preconsultation",
      icon: IoMdPaper,
    },
  ],
};

export const collaboratorMenu = {
  collaborator: [
    {
      name: "البيانات الشخصية",
      url: "/profile",
      icon: User,
    },
    {
      name: "الطلبات",
      url: "/orders",
      icon: ShoppingBag,
    },
    {
      name: "المستحقات",
      url: "/dues",
      icon: CircleDollarSign,
    },
  ],
};
