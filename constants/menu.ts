// types
import { Link } from "@/types/layout";

// constants
import { CENTERS_ENABLED } from "@/constants/centers";

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
  Building2,
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
  LibraryBig,
  LayoutGrid,
  Boxes,
  Scale,
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
  // centers: shown from launch (CENTERS_ENABLED)
  // ...(CENTERS_ENABLED
  //   ? [{ label: "المراكز", link: "/centers", icon: Building2 }]
  //   : []),
  // {
  //   label: "المدونة",
  //   link: "/articles",
  //   icon: Newspaper,
  // },
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
    label: "المدونة",
    link: "/articles",
    icon: Newspaper,
  },
  {
    label: "حجز فوري",
    link: "/instant",
    icon: Zap,
    status: true,
  },
  {
    label: "البرامج",
    link: "/programs",
    icon: NotebookText,
    status: true,
  },
  {
    label: "سؤال و جواب",
    link: "/questions",
    icon: MessageCircleQuestionIcon,
    status: true,
  },
  {
    label: "الكوبونات",
    link: "/coupons",
    icon: BadgePercent,
    status: true,
  },
  {
    label: "الباقات التوفيرية",
    link: "/packages",
    icon: Boxes,
    status: true,
  },
  {
    label: "جلسة مجانية",
    link: "/freesessions",
    icon: Gift,
    status: true,
  },
  {
    label: "جلسة توجيهية",
    link: "/preconsultation",
    icon: MessageSquareWarning,
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
    label: "المحادثات",
    link: "/chats",
    icon: MessageSquareMore,
    status: true,
  },
  {
    label: "المرافعات",
    link: "/pleadings",
    icon: Scale,
    status: true,
    law: true,
  },
  {
    label: "الباقات",
    link: "/packages",
    icon: LibraryBig,
    status: true,
  },
  {
    label: "التخصصات الدقيقة",
    link: "/specialty",
    icon: LayoutGrid,
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
