// React & Next
import Image from "next/image";

// components
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";

// utils
import { cn } from "@/lib/utils";

// icons
import { DollarSign, Medal, Shield } from "lucide-react";

const Benefits = () => {
  // benefits
  const benefits = [
    {
      title: "أمان أكثر",
      p: "ندرك أن الاستشارات تتطلب من عملاءئنا إعطاء معلومات بالغة الخصوصية، لذا وحرصاً على خصوصيتكم فجميع مستشارينا ملزمون بإتفاقيات قانونية تضمن حقظ خصوصية العملاء.",
      icon: Shield,
    },

    {
      title: "مستشارين مميزين",
      p: "تم انتقاء نخبة من أكفأ المستشارين السعوديين المتخصصين في المجال الأسري لتقديم مشورة ذات قيمة عالية خدمة تترك أثراً ملموساً في قرارت العميل",
      icon: Medal,
    },

    {
      title: "أسعار أفضل",
      p: "رؤية شاورني هي تقديم أعلى قيمة بأقل سعر ممكن. تختلف الاسعار في منصة شاورني بين مستشار وآخر لكنها تتفق في أنها من بين الأسعار الأكثر تنافسية في السوق المحلي",
      icon: DollarSign,
    },
  ];

  return (
    <Section className="bg-[#F1F8FE] py-10 space-y-8">
      <Title
        title="خطوتك الذكية نحو قرار أوضح وحياة أهدأ"
        subTitle="لماذا شاورني ؟ "
      />
      {/* cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-fit mx-auto px-5">
        {benefits.map((i, index) => (
          <div
            key={index}
            className="relative max-w-92 bg-white px-5 pt-6 pb-3 space-y-6 border border-gray-200 rounded-3xl"
          >
            <div className="flex justify-between items-center">
              <div
                className={cn(
                  "inline-flex items-center",
                  index !== 0 && "gap-1",
                )}
              >
                <Image
                  src={`/svg/icons/icon-n${index + 1}.svg`}
                  alt="icon"
                  width={40}
                  height={40}
                  className="h-16"
                />
                <Image
                  src="/svg/icons/icon-n0.svg"
                  alt="icon"
                  width={45}
                  height={45}
                  className="h-14"
                />
              </div>
              <div className="flex justify-center items-center bg-blue-100 w-14 h-14 rounded-full">
                <i.icon className="text-blue-400 w-6 h-6" />
              </div>
            </div>
            <h4 className="text-[#094577] text-2xl font-medium">{i.title}</h4>
            <p className="text-sm text-gray-800">{i.p}</p>
            <div className="absolute bottom-0 inset-x-0 mx-auto w-11/12 h-2 rounded-xl bg-[#094577]" />
          </div>
        ))}
      </div>
    </Section>
  );
};

export default Benefits;
