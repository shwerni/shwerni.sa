// React & Next
import Link from "next/link";
import Image from "next/image";

// components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CopyButton from "@/components/shared/copy-button";

// utils
import { findCategory } from "@/utils";

// lib
import { CouponType } from "@/lib/generated/prisma/enums";

// types
import { CouponConsultant } from "@/types/layout";

// props
interface Props {
  coupon: CouponConsultant;
}

const CouponCard: React.FC<Props> = ({ coupon }: Props) => {
  return (
    <div className="relative flex flex-col items-center justify-between bg-linear-to-b from-[#CFE5F8] from-30% via-blue-50 via-50% to-white px-4 pt-6 rounded-3xl shadow shadow-gray-100 border border-gray-100  overflow-hidden">
      {/* square */}
      <div
        className="absolute top-0 h-32 w-full
      bg-linear-to-r from-gray-100 via-transparent via-4%  to-transparent
      bg-size-[45px_45px]
      [-webkit-mask-image:linear-gradient(to_bottom,black_60%,transparent_100%)]"
      />
      <div
        className="absolute top-0 h-32 w-full
      bg-linear-to-b from-gray-100 via-transparent via-4% to-transparent
      bg-size-[45px_45px]
      "
      />
      {/* content */}
      {/* coupon image*/}
      <Image
        src="/svg/home/home-coupons.svg"
        alt="icon"
        width={80}
        height={80}
        className="z-5"
      />
      {/* card */}
      <div className="w-full space-y-5 py-3">
        {/* consultant info */}
        <div className="w-fit mx-auto space-y-3">
          <div className="inline-flex items-end gap-1">
            {coupon.type === CouponType.PLATFORM && (
              <Image
                src="/svg/shwerni-logo-icon.svg"
                alt="icon"
                width={25}
                height={25}
              />
            )}
            <h4 className="text-xl text-gray-700 text-center font-medium">
              {coupon.consultant.name}
            </h4>
          </div>
          <h5 className="text-sm text-gray-700 text-center">
            {coupon.type === CouponType.PLATFORM
              ? "جميع الفئات"
              : findCategory(coupon.consultant.category)?.label}
          </h5>
        </div>
        {/* code info */}
        <div className="flex flex-col items-center gap-2">
          <Badge className="bg-gray-100 text-gray-6800 text-sm font-semibold border border-gray-200">
            خصم {coupon.discount} %
          </Badge>
          <h4 className="text-2xl sm:text-3xl text-black text-center font-semibold">
            {coupon.code}
          </h4>
        </div>
        {/* actions buttons */}
        <div className="space-y-2">
          <Button className="w-full" variant="primary" size="lg" asChild>
            <Link
              href={
                coupon.type === CouponType.PLATFORM
                  ? "/consultants"
                  : `/consultants/${coupon.consultantId}`
              }
              scroll={true}
            >
              استخدم الآن
            </Link>
          </Button>
          <div className="w-fit mx-auto">
            <CopyButton
              value={coupon.code}
              variant="transparent"
              label="نسخ الكود"
              className="text-gray-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponCard;
