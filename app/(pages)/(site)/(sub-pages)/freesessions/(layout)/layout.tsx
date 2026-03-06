import Image from "next/image";
import { FaCheckCircle } from "react-icons/fa";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const summary = [
    {
      title: "فرصة أولى بدون التزام مالي",
      description:
        "تمكّنك هذه الميزة من تجربة التوجيه دون الحاجة للدفع أو الالتزام بجلسة كاملة.",
    },
    {
      title: "توجيه شخصي من خبراء معتمدين",
      description:
        "احصل على نصائح مباشرة من مستشارين موثوقين ومعتمدين في مجالاتهم.",
    },
    {
      title: "استشارة مكتوبة تصل مباشرة إليك",
      description:
        "استفسارك يُرسل إلى المستشار، وتتلقى الرد بشكل مكتوب يسهّل الرجوع إليه لاحقًا.",
    },
    {
      title: "مثالي الراغبين في تجربة مبدئية بسيطة",
      description: "نمنحك فرصة للتعرف على جودة المنصة قبل حجز جلسة مدفوعة.",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative flex flex-col items-center gap-5 text-center bg-linear-to-b from-[#34068312] to-[#7E91FF47] mx-auto py-14">
        {/* content */}
        <h3 className="text-[#094577] text-3xl lg:text-4xl font-semibold">
          جرّب شاورني مجانًا{" "}
        </h3>
        <p className="max-w-2xl text-gray-800 text-base font-medium leading-8">
          ابدأ جلستك التعريفية المجانية مع أحد مستشارينا لتتعرف على المنصة
          وتكتشف كيف يمكننا دعمك، دون أي التزام مالي.
        </p>

        {/* images style */}
        <Image
          src="/svg/home/home-stars.svg"
          alt="icon"
          width={300}
          height={300}
          className="absolute top-2 right-0"
        />
      </div>

      {/* content */}
      {children}

      {/* cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 bg-[#F1F8FE] py-6 px-3">
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-medium">
            لماذا ستستفيد من الجلسة المجانية الشهرية؟
          </h3>
          <Image src="/svg/question.svg" alt="icon" width={150} height={150} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.map((i, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 bg-white py-2 px-3 rounded-md"
            >
              <div className="inline-flex items-center gap-1">
                <FaCheckCircle className="w-4 text-theme" />
                <span className="text-xs font-semibold text-gray-700">
                  {i.title}
                </span>
              </div>
              <span className="text-xs font-medium text-gray-700">
                {i.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
