// React & Next
import Image from "next/image";
import { cacheLife } from "next/cache";

// components
import { Badge } from "@/components/ui/badge";
import CopyButton from "@/components/shared/copy-button";
import { LinkButton } from "@/components/shared/link-button";

// icons
import { RiCouponLine } from "react-icons/ri";
import { getConsultantCoupons } from "@/data/consultant";

// props
interface Props {
  cid: number;
}

const ConsultantCoupons = async ({ cid }: Props) => {
  // coupons
  const coupons = await getCoupons(cid);

  // validate
  if (!coupons || coupons.length === 0) return;

  return (
    <div className="space-y-3">
      {/* title */}
      <div className="inline-flex items-center gap-2">
        <RiCouponLine className="w-5 h-5 text-theme" />
        <h4 className="text-[#094577] text-base font-semibold">
          كوبونات الخصم
        </h4>
      </div>
      {/* coupons */}
      {coupons && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-3 gap-x-5">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="flex flex-col items-center gap-2 sm:gap-3 border border-[#F3F4F6] rounded-xl py-2 sm:py-4 px-1 sm:px-2 bg-linear-to-l from-[#117ed821] to-white"
            >
              {/* coupon info */}
              <div className="flex items-start sm:justify-between w-full">
                {/* coupon image*/}
                <Image
                  src="/svg/home/home-coupons.svg"
                  alt="icon"
                  width={50}
                  height={50}
                />
                {/* code */}
                <div className="flex flex-col items-center gap-1.5">
                  {/* code */}
                  <h6 className="text-gray-800 font-bold text-sm">
                    {coupon.code}
                  </h6>
                  {/* copupon discount */}
                  <Badge className="bg-white text-black text-xs font-semibold">
                    خصم {coupon.discount}%
                  </Badge>
                </div>
                {/* copy button */}
                <CopyButton
                  variant="transparent"
                  value={coupon.code}
                  hideLabel
                />
              </div>
              {/* reserve // add copy first then scroll */}
              <LinkButton href="#reserve" variant="primary" className="w-full">
                استخدم الآن
              </LinkButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const getCoupons = async (cid: number) => {
  // coupons
  "use cache";
  cacheLife("hours");
  return await getConsultantCoupons(cid);
};

export default ConsultantCoupons;
