// prisma types
import {
  ConsultantState,
  Categories,
  Payment,
  UserRole,
  rateState,
  Meeting,
  Order,
  Program,
  ApprovalState,
  Review,
  Guest,
  UsedCoupon,
} from "@/lib/generated/prisma/client";

// category
export interface Category {
  id: Categories;
  label: string;
  category: string;
  link?: string;
  icon?: React.node | string;
  status: boolean;
  style?: string;
}

// consultant status
export interface CStatus {
  state: ConsultantState;
  label: string;
  color: string;
}

// consultant status
export interface Approval {
  state: ApprovalState;
  label: string;
  color: string;
}

// payment status
export interface PaymentType {
  state: PaymentState;
  label: string;
  style: string;
}

// order status
export interface RStatus {
  state: rateState;
  label: string;
  color: string;
}

// order method
export interface Payments {
  label: string;
  description: string;
  image: string;
  mehtod: PaymentMethod;
}

// chats
export interface Chats {
  count: number;
  phone: string;
  seen: number;
  swaid: string;
  updatetime: Date | string;
}

// currency value
export type CurrencyValue =
  | "AED"
  | "SAR"
  | "KWD"
  | "BHD"
  | "QAR"
  | "EGP"
  | "OMR";

// currency
export interface Currency {
  label: string;
  name: string;
  value: CurrencyValue;
  symbole: string;
  tabbyMerchantCode: string;
}

// user
export interface zUsers {
  id: number;
  label: string;
  role: UserRole;
  url: string;
  greeting?: string;
  description?: string;
}

// reservation
export type Reservation = Order & {
  consultant: {
    name: string;
    phone: string;
  };
  meeting?: Meeting[];
  payment?: (Payment & { usedCoupon?: UsedCoupon | null }) | null;
  program?: Program | null;
  guest?: Guest | null;
};

// reviews
type ConsultantReview = Review & {
  consultant: {
    name: string;
  };
};

// program
type ConsultantsProgram = Program & {
  ProgramConsultant: {
    active: boolean;
    status: ProgramEnrollState;
    consultant: {
      cid: number;
      name: string;
    };
  }[];
};

// user
export interface EmployeesData {
  id: number;
  name: string;
  telegramId: string;
  role: "admin" | "reviewer" | "customer-service";
}

// time phases
export type TimePhase = "late" | "day" | "noon" | "night";

// time phases
export type Times = {
  value: string;
  label: string;
  phase: TimePhase;
};

// type
type TimeMeta = Omit<Times, "value">;
