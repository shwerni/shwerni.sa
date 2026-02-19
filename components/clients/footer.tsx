// React & Next
import Link from "next/link";
import Image from "next/image";

// constant
import { navLinks, subPages } from "@/constants/menu";
import { paymentsFooter, contactUs, socialMedia } from "@/constants/data";
import Logo from "../shared/logo";

const Footer = () => {
  // links
  const navigation = [
    {
      title: "خريطة الموقع",
      data: navLinks,
    },
    {
      title: "روابط مهمة",
      data: subPages,
    },
    {
      title: "تواصل معنا",
      data: contactUs,
    },
  ];

  // data
  const legal = [
    {
      title: "توثيق التجارة الالكترونية",
      value: "0000125559",
      image: "/svg/footer/footer-verified.svg",
    },
    {
      title: "الرقم الضريبي",
      value: "311678040900003",
      image: "/svg/footer/footer-vat.svg",
    },
  ];

  return (
    <footer className="relative bg-[#052A47] pt-10 pb-40 px-3 sm:px-5 mx-auto space-y-5 rounded">
      {/* about */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center sm:gap-8">
        <div className="flex flex-col gap-3">
          {/* about shwerni */}
          <Logo
            variant="white"
            width={150}
            height={150}
            className="mx-auto md:mx-0"
          />
          <p className="text-gray-200 text-[0.8rem] text-center md:text-right">
            شاورني منصة استشارية رقمية، وإحدى خدمات مكتب مشاورة للخدمات
            التجارية، تربط الأفراد والشركات بنخبة من المستشارين والخبراء لتسهيل
            الوصول إلى المشورة الموثوقة بسرعة وخصوصية.
          </p>
          {/* legal cards */}
          <div className="flex items-center gap-5 py-2">
            {legal.map((i, index) => (
              <div
                key={index}
                className="flex items-center gap-3 border-[0.5] border-gray-100 rounded-sm"
              >
                <Image
                  src={i.image}
                  alt="logo"
                  width={30}
                  height={30}
                  className="p-1"
                />
                <div className="flex flex-col gap-0.75 pl-2.5 pr-0.5 py-0.5">
                  <h5 className="text-gray-200 text-xs">{i.title}</h5>
                  <h5 className="text-gray-200 text-xs">{i.value}</h5>
                </div>
              </div>
            ))}
          </div>
          {/* payment methods */}
          <div className="flex items-center gap-4 py-4">
            {paymentsFooter.map((i, index) => (
              <Image
                src={"/svg/footer/" + i.icon}
                alt={i.label}
                width={35}
                height={35}
                key={index}
                className="w-[35px] h-[35px]"
              />
            ))}
          </div>
        </div>
        {/* links */}
        <div className="grid grid-cols-3 sm:gap-5">
          {navigation.map((i, index) => (
            <div key={index} className="space-y-4">
              <div className="space-y-1.5">
                <h4 className="text-lg text-gray-200">{i.title}</h4>
                <div className="w-10 h-0.5 bg-[#117ED8] rounded-2xl" />
              </div>
              <div className="flex flex-col gap-2">
                {i.data.map((i, index) => (
                  <Link
                    key={index}
                    href={i.link}
                    className="text-gray-200 text-xs sm:text-sm"
                  >
                    {i.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* social media and copy right */}
      <div className="flex flex-col justify-center items-center gap-5">
        <div className="flex items-center gap-5">
          {socialMedia.map((i, index) => (
            <Link key={index} href={i.link}>
              <Image
                src={"/svg/footer/" + i.icon}
                alt={i.label}
                width={20}
                height={20}
              />
            </Link>
          ))}
        </div>
        {/* copy rights */}
        <h6 className="text-gray-300 text-center text-xs">
          مكتب مشاورة للخدمات التجارية - جميع الحقوق محفوظة ©
        </h6>
      </div>
      {/* layout */}
      <Image
        src="/svg/footer/footer-r.svg"
        alt="logo"
        width={100}
        height={100}
        className="absolute bottom-1 right-5 w-32 sm:w-auto sm:h-auto"
      />
      <Image
        src="/svg/footer/footer-l.svg"
        alt="logo"
        width={100}
        height={100}
        className="absolute bottom-6 left-5 w-32 sm:w-auto sm:h-auto"
      />
    </footer>
  );
};

export default Footer;
