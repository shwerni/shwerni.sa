import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { frequentQuestions, socialMedia } from "@/constants/data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhoneInput from "@/components/shared/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Earth, Mail, Phone } from "lucide-react";
import CopyButton from "@/components/shared/copy-button";
import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/shared/link-button";

const Page = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* frequent questions */}
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-5">
          <h3 className="text-[#094577] text-xl sm:text-2xl font-semibold">
            الأسئلة الشائعة
          </h3>
          <div className="h-1 w-28 bg-gray-200 rounded" />
        </div>
        <Accordion type="single" collapsible>
          {frequentQuestions.map((i, index) => (
            <AccordionItem
              value={String(index)}
              key={index}
              className="px-3 data-[state=open]:bg-[#F1F8FE] rounded"
            >
              <AccordionTrigger className="[&>svg]:bg-gray-100 [&>svg]:rounded-full [&>svg]:w-8 [&>svg]:h-8 [&>svg]:p-2 hover:no-underline">
                <div className="inline-flex items-center gap-3">
                  <span className="text-xl sm:text-2xl font-semibold text-[#AAD6F8]">
                    0{index + 1}
                  </span>
                  <span className="text-[#094577] text-base sm:text-lg font-semibold">
                    {i.title}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="font-medium text-sm data-[state=open]:bg-[#F1F8FE]">
                {i.desc}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      {/* contact */}
      <div className="py-6 space-y-8">
        <div className="flex flex-col items-center gap-5">
          <h3 className="text-[#094577] text-xl sm:text-2xl font-semibold">
            تواصل معنا
          </h3>
          <h5 className="text-sm text-gray-500 font-medium">
            يمكنك التواصل معنا دوماً لأي استفسار على مدى 24/7
          </h5>
          <div className="h-1 w-28 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 px-5">
          {/* contact form */}
          <div
            className="py-8 px-3 border-[#E5E7EB] border rounded-md space-y-6"
            style={{
              background: `
    linear-gradient(90deg, rgba(126, 197, 255, 0.15) -18.26%, rgba(126, 197, 255, 0.06) 37.32%, rgba(255, 255, 255, 0.055) 89.36%),
    linear-gradient(0deg, rgba(82, 159, 221, 0.14), rgba(82, 159, 221, 0.14)),
    linear-gradient(90deg, rgba(255, 255, 255, 0.6) 8.37%, rgba(246, 186, 255, 0.126) 99.99%, rgba(254, 156, 187, 0.126) 100%),
    #FFFFFF
  `,
            }}
          >
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>البريد الالكتروني</Label>
              <Input className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <div dir="ltr">
                <PhoneInput className="bg-white rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الرسالة</Label>
              <Textarea className="resize-none bg-white" />
            </div>
            <div className="flex justify-end w-full">
              <Button type="button" variant="primary" className="px-10">
                إرسال
              </Button>
            </div>
          </div>
          {/* contact info */}
          <div className="space-y-5">
            <div className="flex flex-col gap-3">
              <div className="bg-[#0794551a] py-4 px-6 rounded-lg space-y-2.5 border-[#E5E7EB]">
                <h3 className="text-sm font-semibold">لديك سؤال أو استفسار؟</h3>
                <p className="text-sm">
                  تواصل معنا عبر واتساب، وسيقوم فريقنا بالرد عليك ومساعدتك في
                  أسرع وقت
                </p>
                <div className="flex justify-end w-full">
                  <LinkButton
                    className="bg-[#34BE8F] text-white"
                    href="https://wa.me/966554117879"
                  >
                    فتح واتساب
                  </LinkButton>
                </div>
              </div>
            </div>
            <div className="w-full inline-flex items-center gap-3 px-5 py-2.5 bg-gray-50 rounded-md">
              <Earth className="w-4 text-theme" />
              <span>السعودية - الرياض</span>
            </div>
            <div className="w-full inline-flex items-center justify-between px-5 py-2.5 bg-gray-50 rounded-md">
              <div className="inline-flex items-center gap-3">
                <Phone className="w-4 text-theme" />
                <span className="text-sm font-medium">+966 554117879</span>
              </div>
              <CopyButton
                hideLabel
                value="966554117879"
                size="sm"
                iconClassName="text-theme bg-transparent"
              />
            </div>
            <div className="w-full inline-flex items-center justify-between px-5 py-2.5 bg-gray-50 rounded-md">
              <div className="inline-flex items-center gap-3">
                <Mail className="w-4 text-theme" />
                <span className="text-sm font-medium">support@shwerni.com</span>
              </div>
              <CopyButton
                hideLabel
                value="support@shwerni.com"
                size="sm"
                iconClassName="text-theme bg-transparent"
              />
            </div>
            <div className="w-full inline-flex items-center justify-between px-5 py-2.5 bg-gray-400 rounded-md">
              <span className="text-white text-sm font-semibold">
                تابعنا على{" "}
              </span>
              <div>
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
