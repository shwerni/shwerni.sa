import {
  Article,
  Consultant,
  Coupon,
  Specialty,
} from "@/lib/generated/prisma/client";

// links
export interface Link {
  label: string;
  link: string;
  icon?: React.ReactNode | IconType | string;
  status?: boolean;
}

// cards
export interface Card {
  title: string;
  subTitle?: string;
  desc: string;
  icon?: React.ReactNode | IconType | string;
}

// preview owner profile
export interface OwnerPreview {
  cid: number;
  name: string;
  title: string;
  image: string | null;
  category: Categories;
  rate: number | null;
  gender: Gender;
  cost30?: number;
  discount?: string;
}

// consultant card
export type ConsultantCard = Pick<
  Consultant,
  | "cid"
  | "name"
  | "title"
  | "image"
  | "category"
  | "rate"
  | "gender"
  | "cost30"
  | "created_at"
> & {
  specialties: string[];
  reviews: number | null;
  years: number;
};

// consultant's coupon card
export type CouponConsultant = Coupon & {
  consultant: Pick<
    Consultant,
    "name" | "image" | "category" | "rate" | "gender"
  >;
};

// articleItem
export type ArticleItem = Pick<Consultant, "name" | "rate"> &
  Article & { length: number } & { specialties: string[] };
