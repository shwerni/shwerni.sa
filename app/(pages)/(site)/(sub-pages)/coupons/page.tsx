// React & Next
import { Suspense } from "react";
import type { Metadata } from "next";

// data
import { getCoupons } from "@/data/coupon";

// components
import Search from "@/components/clients/coupons/search";
import CouponCard from "@/components/clients/shared/coupons-card";
import CouponsNavigation from "@/components/clients/coupons/navigation";

// nuqs
import {
  parseAsString,
  parseAsInteger,
  createSearchParamsCache,
} from "nuqs/server";
import { SearchParams } from "nuqs/server";

// constants
import { mainRoute } from "@/constants/links";

const searchParamsCache = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  search: parseAsString.withDefault(""),
});

export const metadata: Metadata = {
  title: "كوبونات الخصم",
  description:
    "تصفح كوبونات الخصم المتاحة على منصة شاورني واحصل على خصومات حصرية على جلسات الاستشارة النفسية والأسرية",

  keywords: [
    "كوبون خصم شاورني",
    "كوبونات استشارات",
    "خصم جلسات نفسية",
    "كود خصم شاورني",
    "عروض شاورني",
    "تخفيضات استشارات",
    "كوبون حجز استشارة",
    "شاورني كوبون",
    "coupon shwerni",
    "discount code shwerni",
  ],

  alternates: {
    canonical: `${mainRoute}coupons`,
    languages: {
      "ar-SA": `${mainRoute}coupons`,
    },
  },

  openGraph: {
    type: "website",
    url: `${mainRoute}coupons`,
    siteName: "شاورني",
    locale: "ar_SA",
    title: "كوبونات الخصم | شاورني",
    description:
      "تصفح كوبونات الخصم المتاحة على منصة شاورني واحصل على خصومات حصرية على جلسات الاستشارة النفسية والأسرية",
    images: [
      {
        url: `${mainRoute}layout/shwerni.jpg`,
        alt: "شاورني - كوبونات الخصم",
        type: "image/jpeg",
        width: 1200,
        height: 630,
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    site: "@shwernisa",
    creator: "@shwernisa",
    title: "كوبونات الخصم | شاورني",
    description:
      "تصفح كوبونات الخصم المتاحة على منصة شاورني واحصل على خصومات حصرية على جلسات الاستشارة النفسية والأسرية",
    images: [
      {
        url: `${mainRoute}layout/shwerni.jpg`,
        alt: "شاورني - كوبونات الخصم",
        width: 1200,
        height: 630,
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

interface Props {
  searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
  const { page, search } = await searchParamsCache.parse(searchParams);

  const { coupons, total, pages } = await getCoupons(page, search);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-10 space-y-8">
      {/* header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-800">كوبونات الخصم</h1>
        <p className="text-sm text-gray-500">
          استخدم الكوبون عند الحجز للحصول على خصم
        </p>
      </div>

      {/* search */}
      <div className="max-w-sm">
        <Search />
      </div>

      {/* results */}
      {coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <span className="text-4xl">🎟️</span>
          <p className="text-sm">
            {search
              ? `لا توجد كوبونات للمستشار "${search}"`
              : "لا توجد كوبونات متاحة حالياً"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {coupons.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </div>
      )}

      {/* pagination */}
      <Suspense>
        <CouponsNavigation current={page} total={total} pages={pages} />
      </Suspense>
    </div>
  );
};

export default Page;
