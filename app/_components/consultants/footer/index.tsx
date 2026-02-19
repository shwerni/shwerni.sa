// React & Next
import Link from "next/link";
import Image from "next/image";

// components
import { SLogo } from "../../layout/logo";

// constants
import { contactUsData, socialMedia } from "@/constants/data";

export default function Footer() {
  return (
    <div className="flex flex-col justify-between sm:gap-20 gap-14 pt-10 pb-3 px-5 bg-zblack-100">
      <div className="flex flex-col items-end justify-between gap-5">
        {/* logo */}
        <SLogo />
        {/* details */}
        <div className="flex flex-col gap-3" dir="rtl">
          {contactUsData.map((i, index) => (
            <h6 key={index} className="text-white text-right">
              {i}
            </h6>
          ))}
        </div>
      </div>
      {/* social and pages */}
      <div className="grid sm:grid-cols-2 grid-rows-1 sm:gap-0 gap-12 px-5">
        {/* social media page links */}
        <div
          className="flex flex-row sm:items-start items-center sm:gap-3 gap-5"
          dir="rtl"
        >
          <h3 className="text-white">تابعونا على:</h3>
          {socialMedia.map((i, index) => (
            <Link
              href={i.link}
              key={index}
              className="flex flex-row justify-end gap-5"
            >
              <Image src={i.icon} alt="icon" width={40} height={40} />
            </Link>
          ))}
        </div>
        {/* contact us */}
        <div className="flex flex-col items-start gap-3" dir="rtl">
          <h3 className="text-white">الشروط و الاحكام</h3>
          <Link href={"/privacy?owner"}>
            <h6 className="text-white">الشروط و الاحكام الخاص بالمستشارين</h6>
          </Link>
        </div>
      </div>
      <div className="cflex m-3">
        <h6 className="text-center">
          © مكتب مشاورة للخدمات التجارية - جميع الحقوق محفوظة
        </h6>
        {/* <h6 className="text-xs text-zgrey-100 tracking-widest font-light capitalize">
          By ziadAboalmajd copyright © shwerni
        </h6> */}
      </div>
    </div>
  );
}
